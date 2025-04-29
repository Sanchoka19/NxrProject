import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, checkRole } from "./auth";
import { z } from "zod";
import { 
  insertClientSchema, 
  insertServiceSchema, 
  insertBookingSchema,
  insertOrganizationSchema,
  insertSubscriptionSchema
} from "@shared/schema";
import { sendInvite } from "./controllers/invite.controller";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Clients routes
  app.get("/api/clients", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const clients = await storage.getClientsByOrganization(user.organizationId);
      res.json(clients);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clients/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Check if client belongs to user's organization
      if (client.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(client);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/clients", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const validation = insertClientSchema.safeParse({
        ...req.body,
        organizationId: user.organizationId
      });
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid client data",
          errors: validation.error.errors
        });
      }
      
      const client = await storage.createClient(validation.data);
      res.status(201).json(client);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/clients/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const existingClient = await storage.getClient(id);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Check if client belongs to user's organization
      if (existingClient.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Only update allowed fields
      const updateData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        company: req.body.company,
        address: req.body.address,
        notes: req.body.notes,
        isActive: req.body.isActive
      };
      
      const updatedClient = await storage.updateClient(id, updateData);
      res.json(updatedClient);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/clients/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Check if client belongs to user's organization
      if (client.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteClient(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Services routes
  app.get("/api/services", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const services = await storage.getServicesByOrganization(user.organizationId);
      res.json(services);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/services/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Check if service belongs to user's organization
      if (service.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(service);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/services", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const validation = insertServiceSchema.safeParse({
        ...req.body,
        organizationId: user.organizationId
      });
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid service data",
          errors: validation.error.errors
        });
      }
      
      const service = await storage.createService(validation.data);
      res.status(201).json(service);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/services/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const existingService = await storage.getService(id);
      if (!existingService) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Check if service belongs to user's organization
      if (existingService.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Only update allowed fields
      const updateData = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        duration: req.body.duration
      };
      
      const updatedService = await storage.updateService(id, updateData);
      res.json(updatedService);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/services/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Check if service belongs to user's organization
      if (service.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteService(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Bookings routes
  app.get("/api/bookings", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const bookings = await storage.getBookingsByOrganization(user.organizationId);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/bookings/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if booking belongs to a client in user's organization
      const client = await storage.getClient(booking.clientId);
      if (!client || client.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(booking);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/bookings", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const validation = insertBookingSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid booking data",
          errors: validation.error.errors
        });
      }
      
      // Verify client and service belong to user's organization
      const client = await storage.getClient(validation.data.clientId);
      const service = await storage.getService(validation.data.serviceId);
      
      if (!client || client.organizationId !== user.organizationId) {
        return res.status(400).json({ message: "Invalid client" });
      }
      
      if (!service || service.organizationId !== user.organizationId) {
        return res.status(400).json({ message: "Invalid service" });
      }
      
      const booking = await storage.createBooking(validation.data);
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/bookings/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const existingBooking = await storage.getBooking(id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if booking belongs to a client in user's organization
      const client = await storage.getClient(existingBooking.clientId);
      if (!client || client.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Only update allowed fields
      const updateData = {
        status: req.body.status,
        date: req.body.date,
        notes: req.body.notes,
        serviceId: req.body.serviceId,
        clientId: req.body.clientId
      };
      
      // If changing client or service, verify they belong to user's organization
      if (updateData.clientId && updateData.clientId !== existingBooking.clientId) {
        const newClient = await storage.getClient(updateData.clientId);
        if (!newClient || newClient.organizationId !== req.user.organizationId) {
          return res.status(400).json({ message: "Invalid client" });
        }
      }
      
      if (updateData.serviceId && updateData.serviceId !== existingBooking.serviceId) {
        const newService = await storage.getService(updateData.serviceId);
        if (!newService || newService.organizationId !== req.user.organizationId) {
          return res.status(400).json({ message: "Invalid service" });
        }
      }
      
      const updatedBooking = await storage.updateBooking(id, updateData);
      res.json(updatedBooking);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/bookings/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if booking belongs to a client in user's organization
      const client = await storage.getClient(booking.clientId);
      if (!client || client.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteBooking(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Organization routes
  app.get("/api/organization", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const organization = await storage.getOrganization(user.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/organization", checkRole(['founder', 'admin']), async (req, res, next) => {
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const organization = await storage.getOrganization(user.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Only update allowed fields
      const updateData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address
      };
      
      const updatedOrganization = await storage.updateOrganization(user.organizationId, updateData);
      res.json(updatedOrganization);
    } catch (error) {
      next(error);
    }
  });
  
  // Invitation routes
  app.post("/api/invitations", checkRole(['founder', 'admin']), sendInvite);
  
  // Organization invite - alias to the invitations route for UI consistency
  app.post("/api/organization/invite", checkRole(['founder', 'admin']), sendInvite);
  
  // Verify invitation token
  app.get("/api/invitations/verify/:token", async (req, res, next) => {
    try {
      const inviteToken = req.params.token;
      if (!inviteToken) {
        return res.status(400).json({ message: "Invalid invitation token" });
      }
      
      const invitation = await storage.getInvitationByToken(inviteToken);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if invitation is expired
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if invitation has already been used
      if (invitation.isUsed) {
        return res.status(400).json({ message: "Invitation has already been used" });
      }
      
      // Return invitation details without sensitive data
      return res.status(200).json({
        email: invitation.email,
        role: invitation.role,
        organizationId: invitation.organizationId
      });
    } catch (error) {
      next(error);
    }
  });

  // Subscription routes
  app.get("/api/subscription", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const subscription = await storage.getSubscriptionByOrganization(user.organizationId);
      res.json(subscription || null);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/subscription", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }

      const { planName, pricePerMonth, maxUsers, startDate, isActive } = req.body;

      // Validate required fields
      if (!planName || !pricePerMonth || !startDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create new subscription
      const subscription = await storage.createSubscription({
        organizationId: user.organizationId,
        planName,
        pricePerMonth,
        maxUsers,
        startDate: new Date(startDate),
        isActive
      });

      res.status(201).json(subscription);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/subscription/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }

      const subscriptionId = parseInt(req.params.id);
      const subscription = await storage.getSubscription(subscriptionId);

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      if (subscription.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Not authorized to update this subscription" });
      }

      const { planName, pricePerMonth, maxUsers, startDate, endDate, isActive } = req.body;

      // Update subscription
      const updatedSubscription = await storage.updateSubscription(subscriptionId, {
        planName,
        pricePerMonth,
        maxUsers,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive
      });

      res.json(updatedSubscription);
    } catch (error) {
      next(error);
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const stats = await storage.getDashboardStats(user.organizationId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard/recent-bookings", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const bookings = await storage.getRecentBookings(user.organizationId, limit);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard/recent-clients", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const clients = await storage.getRecentClients(user.organizationId, limit);
      res.json(clients);
    } catch (error) {
      next(error);
    }
  });

  // Team members route
  app.get("/api/team-members", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const teamMembers = await storage.getTeamMembers(user.organizationId);
      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  });

  // Organization users route - alias for team members
  app.get("/api/organization/users", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const teamMembers = await storage.getTeamMembers(user.organizationId);
      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
