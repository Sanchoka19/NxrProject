import { 
  users, 
  clients, 
  services, 
  bookings, 
  organizations, 
  subscriptions,
  invitations,
  type User, 
  type InsertUser,
  type Client,
  type InsertClient,
  type Service,
  type InsertService,
  type Booking,
  type InsertBooking,
  type Organization,
  type InsertOrganization,
  type Subscription,
  type InsertSubscription,
  type Invitation,
  type InsertInvitation
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientsByOrganization(organizationId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Service operations
  getService(id: number): Promise<Service | undefined>;
  getServicesByOrganization(organizationId: number): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByClient(clientId: number): Promise<Booking[]>;
  getBookingsByOrganization(organizationId: number): Promise<any[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  
  // Organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization | undefined>;
  
  // Subscription operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByOrganization(organizationId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;

  // Dashboard stats
  getDashboardStats(organizationId: number): Promise<any>;
  getRecentBookings(organizationId: number, limit?: number): Promise<any[]>;
  getRecentClients(organizationId: number, limit?: number): Promise<any[]>;

  // Invitation operations
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  markInvitationAsUsed(id: number): Promise<Invitation | undefined>;
  
  // Session storage
  sessionStore: ReturnType<typeof connectPg>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: ReturnType<typeof connectPg>;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientsByOrganization(organizationId: number): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.organizationId, organizationId))
      .orderBy(desc(clients.createdAt));
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(clientData)
      .returning();
    return client;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getServicesByOrganization(organizationId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.organizationId, organizationId))
      .orderBy(services.name);
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(serviceData)
      .returning();
    return service;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(serviceData)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    await db.delete(services).where(eq(services.id, id));
    return true;
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByClient(clientId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.clientId, clientId))
      .orderBy(desc(bookings.date));
  }

  async getBookingsByOrganization(organizationId: number): Promise<any[]> {
    const result = await db
      .select({
        booking: bookings,
        client: clients,
        service: services
      })
      .from(bookings)
      .innerJoin(clients, eq(bookings.clientId, clients.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(clients.organizationId, organizationId))
      .orderBy(desc(bookings.date));

    return result;
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning();
    return booking;
  }

  async updateBooking(id: number, bookingData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(bookingData)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    await db.delete(bookings).where(eq(bookings.id, id));
    return true;
  }

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async createOrganization(organizationData: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values(organizationData)
      .returning();
    return organization;
  }

  async updateOrganization(id: number, organizationData: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set(organizationData)
      .where(eq(organizations.id, id))
      .returning();
    return updatedOrganization;
  }

  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByOrganization(organizationId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.organizationId, organizationId),
        eq(subscriptions.isActive, true)
      ));
    return subscription;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  async updateSubscription(id: number, subscriptionData: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  // Dashboard stats
  async getDashboardStats(organizationId: number): Promise<any> {
    const totalClients = await db
      .select({ count: clients })
      .from(clients)
      .where(eq(clients.organizationId, organizationId))
      .count();
    
    const totalServices = await db
      .select({ count: services })
      .from(services)
      .where(eq(services.organizationId, organizationId))
      .count();
    
    const upcomingBookingsResult = await db
      .select({ count: bookings })
      .from(bookings)
      .innerJoin(clients, eq(bookings.clientId, clients.id))
      .where(and(
        eq(clients.organizationId, organizationId),
        eq(bookings.status, 'confirmed')
      ))
      .count();
    
    return {
      totalClients: totalClients.length > 0 ? Number(totalClients[0].count) : 0,
      activeServices: totalServices.length > 0 ? Number(totalServices[0].count) : 0,
      upcomingBookings: upcomingBookingsResult.length > 0 ? Number(upcomingBookingsResult[0].count) : 0,
      // Note: Monthly revenue would require a more complex calculation involving completed bookings
      // For now, we'll use a placeholder calculation
      monthlyRevenue: 0
    };
  }

  async getRecentBookings(organizationId: number, limit: number = 5): Promise<any[]> {
    const result = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        status: bookings.status,
        clientName: clients.name,
        service: services.name
      })
      .from(bookings)
      .innerJoin(clients, eq(bookings.clientId, clients.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(clients.organizationId, organizationId))
      .orderBy(desc(bookings.createdAt))
      .limit(limit);

    return result;
  }

  async getRecentClients(organizationId: number, limit: number = 5): Promise<any[]> {
    const result = await db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        company: clients.company,
        createdAt: clients.createdAt
      })
      .from(clients)
      .where(eq(clients.organizationId, organizationId))
      .orderBy(desc(clients.createdAt))
      .limit(limit);

    return result;
  }

  // Invitation operations
  async createInvitation(invitationData: InsertInvitation): Promise<Invitation> {
    const [invitation] = await db
      .insert(invitations)
      .values(invitationData)
      .returning();
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.inviteToken, token));
    return invitation;
  }

  async markInvitationAsUsed(id: number): Promise<Invitation | undefined> {
    const [updatedInvitation] = await db
      .update(invitations)
      .set({ isUsed: true })
      .where(eq(invitations.id, id))
      .returning();
    return updatedInvitation;
  }
}

export const storage = new DatabaseStorage();
