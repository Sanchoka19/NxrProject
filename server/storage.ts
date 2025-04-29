import { prisma } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { Prisma } from "@prisma/client";
import pkg from 'pg';
import crypto from 'crypto';
const { Pool } = pkg;

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  createUser(user: any): Promise<any>;
  updateUser(id: number, user: any): Promise<any>;
  deleteUser(id: number): Promise<boolean>;
  
  // Client operations
  getClient(id: number): Promise<any>;
  getClientsByOrganization(organizationId: number): Promise<any[]>;
  createClient(client: any): Promise<any>;
  updateClient(id: number, client: any): Promise<any>;
  deleteClient(id: number): Promise<boolean>;
  
  // Service operations
  getService(id: number): Promise<any>;
  getServicesByOrganization(organizationId: number): Promise<any[]>;
  createService(service: any): Promise<any>;
  updateService(id: number, service: any): Promise<any>;
  deleteService(id: number): Promise<boolean>;
  
  // Booking operations
  getBooking(id: number): Promise<any>;
  getBookingsByClient(clientId: number): Promise<any[]>;
  getBookingsByOrganization(organizationId: number): Promise<any[]>;
  createBooking(booking: any): Promise<any>;
  updateBooking(id: number, booking: any): Promise<any>;
  deleteBooking(id: number): Promise<boolean>;
  
  // Organization operations
  getOrganization(id: number): Promise<any>;
  createOrganization(organization: any): Promise<any>;
  updateOrganization(id: number, organization: any): Promise<any>;
  
  // Subscription operations
  getSubscription(id: number): Promise<any>;
  getSubscriptionByOrganization(organizationId: number): Promise<any>;
  createSubscription(subscription: any): Promise<any>;
  updateSubscription(id: number, subscription: any): Promise<any>;

  // Dashboard stats
  getDashboardStats(organizationId: number): Promise<any>;
  getRecentBookings(organizationId: number, limit?: number): Promise<any[]>;
  getRecentClients(organizationId: number, limit?: number): Promise<any[]>;
  
  // Invitation operations
  createInvitation(invitationData: any): Promise<any>;
  getInvitationByToken(token: string): Promise<any>;
  markInvitationAsUsed(id: number): Promise<any>;
  getTeamMembers(organizationId: number): Promise<any[]>;
  
  // Session storage
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  private pool: any;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.sessionStore = new PostgresSessionStore({ 
      pool: this.pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number) {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async createUser(userData: any) {
    return await prisma.user.create({
      data: userData
    });
  }

  async updateUser(id: number, userData: any) {
    return await prisma.user.update({
      where: { id },
      data: userData
    });
  }

  async deleteUser(id: number) {
    await prisma.user.delete({
      where: { id }
    });
    return true;
  }

  // Client operations
  async getClient(id: number) {
    return await prisma.client.findUnique({
      where: { id }
    });
  }

  async getClientsByOrganization(organizationId: number) {
    return await prisma.client.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createClient(clientData: any) {
    return await prisma.client.create({
      data: clientData
    });
  }

  async updateClient(id: number, clientData: any) {
    return await prisma.client.update({
      where: { id },
      data: clientData
    });
  }

  async deleteClient(id: number) {
    await prisma.client.delete({
      where: { id }
    });
    return true;
  }

  // Service operations
  async getService(id: number) {
    return await prisma.service.findUnique({
      where: { id }
    });
  }

  async getServicesByOrganization(organizationId: number) {
    return await prisma.service.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });
  }

  async createService(serviceData: any) {
    return await prisma.service.create({
      data: serviceData
    });
  }

  async updateService(id: number, serviceData: any) {
    return await prisma.service.update({
      where: { id },
      data: serviceData
    });
  }

  async deleteService(id: number) {
    await prisma.service.delete({
      where: { id }
    });
    return true;
  }

  // Booking operations
  async getBooking(id: number) {
    return await prisma.booking.findUnique({
      where: { id },
      include: {
        client: true,
        service: true
      }
    });
  }

  async getBookingsByClient(clientId: number) {
    return await prisma.booking.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      include: {
        service: true
      }
    });
  }

  async getBookingsByOrganization(organizationId: number) {
    return await prisma.booking.findMany({
      where: {
        client: {
          organizationId
        }
      },
      include: {
        client: true,
        service: true
      },
      orderBy: { date: 'desc' }
    });
  }

  async createBooking(bookingData: any) {
    return await prisma.booking.create({
      data: bookingData,
      include: {
        client: true,
        service: true
      }
    });
  }

  async updateBooking(id: number, bookingData: any) {
    return await prisma.booking.update({
      where: { id },
      data: bookingData,
      include: {
        client: true,
        service: true
      }
    });
  }

  async deleteBooking(id: number) {
    await prisma.booking.delete({
      where: { id }
    });
    return true;
  }

  // Organization operations
  async getOrganization(id: number) {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        users: true,
        clients: true,
        services: true,
        subscriptions: true
      }
    });
  }

  async createOrganization(organizationData: any) {
    return await prisma.organization.create({
      data: organizationData
    });
  }

  async updateOrganization(id: number, organizationData: any) {
    return await prisma.organization.update({
      where: { id },
      data: organizationData
    });
  }

  // Subscription operations
  async getSubscription(id: number) {
    return await prisma.subscription.findUnique({
      where: { id }
    });
  }

  async getSubscriptionByOrganization(organizationId: number) {
    return await prisma.subscription.findFirst({
      where: { 
        organizationId,
        isActive: true
      }
    });
  }

  async createSubscription(subscriptionData: any) {
    return await prisma.subscription.create({
      data: subscriptionData
    });
  }

  async updateSubscription(id: number, subscriptionData: any) {
    return await prisma.subscription.update({
      where: { id },
      data: subscriptionData
    });
  }

  // Dashboard stats
  async getDashboardStats(organizationId: number) {
    const [
      totalClients,
      totalServices,
      totalBookings,
      activeBookings
    ] = await Promise.all([
      prisma.client.count({
        where: { organizationId }
      }),
      prisma.service.count({
        where: { organizationId }
      }),
      prisma.booking.count({
        where: {
          client: {
            organizationId
          }
        }
      }),
      prisma.booking.count({
        where: {
          client: {
            organizationId
          },
          status: 'confirmed'
        }
      })
    ]);

    return {
      totalClients,
      totalServices,
      totalBookings,
      activeBookings
    };
  }

  async getRecentBookings(organizationId: number, limit: number = 5) {
    return await prisma.booking.findMany({
      where: {
        client: {
          organizationId
        }
      },
      include: {
        client: true,
        service: true
      },
      orderBy: { date: 'desc' },
      take: limit
    });
  }

  async getRecentClients(organizationId: number, limit: number = 5) {
    return await prisma.client.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  // Invitation operations
  async createInvitation(invitationData: any) {
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set default expiration to 7 days from now if not provided
    const expiresAt = invitationData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    return await prisma.invitation.create({
      data: {
        email: invitationData.email,
        token,
        role: invitationData.role || 'staff',
        organizationId: invitationData.organizationId,
        expiresAt,
        isUsed: false
      }
    });
  }

  async getInvitationByToken(token: string) {
    return await prisma.invitation.findUnique({
      where: { token }
    });
  }

  async markInvitationAsUsed(id: number) {
    return await prisma.invitation.update({
      where: { id },
      data: { isUsed: true }
    });
  }

  async getTeamMembers(organizationId: number) {
    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Get all pending invitations
    const invitations = await prisma.invitation.findMany({
      where: { 
        organizationId,
        isUsed: false,
        expiresAt: {
          gt: new Date() // Only get non-expired invitations
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        isUsed: true
      }
    });

    // Transform invitations to match user format
    const pendingInvites = invitations.map(invite => {
      const now = new Date();
      const expiresAt = new Date(invite.expiresAt);
      const status = invite.isUsed ? 'used' : 
                    expiresAt < now ? 'expired' : 'pending';

      return {
        id: `invite_${invite.id}`,
        name: invite.email.split('@')[0], // Use email username as name for pending invites
        email: invite.email,
        role: invite.role,
        createdAt: invite.createdAt,
        status,
        inviteExpiresAt: invite.expiresAt
      };
    });

    // Add status to users
    const usersWithStatus = users.map(user => ({
      ...user,
      status: 'active'
    }));

    // Combine users and pending invites
    return [...usersWithStatus, ...pendingInvites];
  }
}

export const storage = new DatabaseStorage();
