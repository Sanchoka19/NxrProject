import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "nexaro-crm-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.passwordHash))) {
            return done(null, false, { message: "Invalid email or password" });
          } else {
            return done(null, user);
          }
        } catch (err) {
          return done(err);
        }
      }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Registration validation schema
  const registerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    organizationId: z.number().optional(),
    role: z.enum(['founder', 'admin', 'staff']).default('staff')
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validation.error.errors 
        });
      }
      
      const { name, email, password, organizationId, role } = validation.data;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        name,
        email,
        passwordHash: await hashPassword(password),
        organizationId,
        role
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't return the passwordHash
        const { passwordHash, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Register with invite endpoint
  app.post("/api/register-with-invite", async (req, res, next) => {
    try {
      // Create a schema that requires the invite token
      const registerWithInviteSchema = registerSchema.extend({
        inviteToken: z.string().min(1, "Invite token is required"),
      }).omit({ organizationId: true, role: true }); // These will come from the invitation
      
      const validation = registerWithInviteSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validation.error.errors,
          code: "VALIDATION_ERROR"
        });
      }
      
      const { name, email, password, inviteToken } = validation.data;
      
      try {
        // Verify the invitation token
        const invitation = await storage.getInvitationByToken(inviteToken);
        
        if (!invitation) {
          return res.status(400).json({ 
            message: "Invalid invitation token",
            code: "INVALID_TOKEN" 
          });
        }
        
        // Check if invitation has already been used
        if (invitation.isUsed) {
          return res.status(400).json({ 
            message: "Invitation has already been used",
            code: "TOKEN_USED" 
          });
        }
        
        // Check if invitation is expired (7 days default)
        if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
          return res.status(400).json({ 
            message: "Invitation has expired",
            code: "TOKEN_EXPIRED" 
          });
        }
        
        // Check if the email matches the invited email (case insensitive)
        if (invitation.email.toLowerCase() !== email.toLowerCase()) {
          return res.status(400).json({ 
            message: "Email does not match the invited email",
            code: "EMAIL_MISMATCH"
          });
        }
        
        // Check if email is already registered
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ 
            message: "Email already registered",
            code: "EMAIL_EXISTS" 
          });
        }

        // Create the user with data from the invitation
        const user = await storage.createUser({
          name,
          email,
          passwordHash: await hashPassword(password),
          organizationId: invitation.organizationId,
          role: invitation.role || 'staff' // Default to staff if no role specified
        });
        
        // Mark the invitation as used
        await storage.markInvitationAsUsed(invitation.id);
        
        // Log in the new user
        req.login(user, (err) => {
          if (err) return next(err);
          
          // Don't return the passwordHash
          const { passwordHash, ...userWithoutPassword } = user;
          
          // Return success with the user data
          res.status(201).json({
            message: "Registration successful",
            user: userWithoutPassword,
            invitation: {
              organizationId: invitation.organizationId,
              role: invitation.role
            }
          });
        });
      } catch (dbError) {
        console.error("Database error during registration:", dbError);
        return res.status(500).json({ 
          message: "Database error occurred while verifying invitation",
          code: "DB_ERROR"
        });
      }
    } catch (error) {
      console.error("Error in register with invite:", error);
      return res.status(500).json({ 
        message: "Registration failed due to server error",
        code: "SERVER_ERROR"
      });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Don't return the passwordHash
        const { passwordHash, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't return the passwordHash
    const { passwordHash, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}

// Middleware to check user role
export function checkRole(role: string | string[]) {
  return (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as User;
    
    if (Array.isArray(role)) {
      if (!role.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
    } else if (user.role !== role) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
}
