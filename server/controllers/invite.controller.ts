import { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { generateInviteToken, sendInvitationEmail } from '../utils/email';
import { addDays } from 'date-fns';

// Create schema for validating invitation input
const inviteSchema = z.object({
  inviteeEmail: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'staff']).optional().default('staff'),
});

/**
 * Send invitation to a user
 */
export const sendInvite = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is associated with an organization
    if (!req.user.organizationId) {
      return res.status(400).json({ message: 'User not associated with an organization' });
    }

    // Validate request body
    const validationResult = inviteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid invitation data', 
        errors: validationResult.error.errors 
      });
    }

    const { inviteeEmail, role } = validationResult.data;

    // Check if email already exists in the user database
    const existingUser = await storage.getUserByEmail(inviteeEmail);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate a unique invitation token
    const inviteToken = generateInviteToken();

    // Calculate expiration date (48 hours from now)
    const expiresAt = addDays(new Date(), 2);

    // Create invitation record in the database
    const invitation = await storage.createInvitation({
      email: inviteeEmail,
      inviteToken,
      organizationId: req.user.organizationId,
      role,
      isUsed: false,
      expiresAt,
    });

    // Send invitation email
    const emailSent = await sendInvitationEmail(inviteeEmail, inviteToken);

    if (emailSent) {
      return res.status(200).json({ 
        message: 'Invitation sent successfully', 
        invitationId: invitation.id 
      });
    } else {
      // If email sending fails, still return success but with a warning
      return res.status(200).json({ 
        message: 'Invitation created but email delivery failed', 
        invitationId: invitation.id,
        warning: 'Email could not be sent. Please verify your email configuration.'
      });
    }
  } catch (error) {
    console.error('Error sending invitation:', error);
    return res.status(500).json({ message: 'Error sending invitation' });
  }
};