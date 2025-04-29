import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Utility function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function main() {
  try {
    console.log('Starting database seed...');

    // Create Organization
    const organization = await prisma.organization.create({
      data: {
        name: 'Nexaro Digital',
        email: 'contact@nexaro.com',
        phone: '+1 (555) 123-4567',
        address: '123 Tech Park, Suite 100, San Francisco, CA 94107',
      },
    });

    console.log(`Created organization: ${organization.name}`);

    // Create Founder User
    const founderPassword = await hashPassword('founder123');
    const founder = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'founder@nexaro.com',
        passwordHash: founderPassword,
        role: 'founder',
        organizationId: organization.id,
      },
    });

    console.log(`Created founder user: ${founder.name}`);

    // Create Services
    const services = await Promise.all([
      prisma.service.create({
        data: {
          name: 'Website Consultation',
          description: 'One-hour consultation to discuss website design and functionality requirements.',
          price: 15000, // $150.00
          duration: 60, // 60 minutes
          organizationId: organization.id,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Brand Identity Package',
          description: 'Complete brand identity design including logo, color palette, typography, and brand guidelines.',
          price: 75000, // $750.00
          duration: 180, // 3 hours
          organizationId: organization.id,
        },
      }),
    ]);

    console.log(`Created ${services.length} services`);

    // Create Dummy Clients
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Emily Cooper',
          email: 'emily@techsolutions.com',
          phone: '+1 (555) 987-6543',
          company: 'Tech Solutions Inc',
          address: '456 Innovation Blvd, Austin, TX 78701',
          notes: 'Referred by Jane Smith',
          organizationId: organization.id,
        },
      }),
      prisma.client.create({
        data: {
          name: 'Alex Morgan',
          email: 'alex@designstudio.com',
          phone: '+1 (555) 456-7890',
          company: 'Design Studio',
          address: '789 Creative Ave, Portland, OR 97205',
          organizationId: organization.id,
        },
      }),
      prisma.client.create({
        data: {
          name: 'Taylor Wilson',
          email: 'taylor@wilsonenterprises.com',
          phone: '+1 (555) 234-5678',
          company: 'Wilson Enterprises',
          address: '321 Business Park, Chicago, IL 60601',
          isActive: false,
          organizationId: organization.id,
        },
      }),
    ]);

    console.log(`Created ${clients.length} clients`);

    // Create some sample bookings
    const now = new Date();
    const bookings = await Promise.all([
      prisma.booking.create({
        data: {
          clientId: clients[0].id,
          serviceId: services[0].id,
          status: 'confirmed',
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 0), // 3 days from now at 10:00 AM
          notes: 'Initial consultation for new website project',
        },
      }),
      prisma.booking.create({
        data: {
          clientId: clients[1].id,
          serviceId: services[1].id,
          status: 'pending',
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 14, 30), // 5 days from now at 2:30 PM
          notes: 'Brand redesign discussion',
        },
      }),
      prisma.booking.create({
        data: {
          clientId: clients[2].id,
          serviceId: services[0].id,
          status: 'completed',
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 0), // 2 days ago at 11:00 AM
          notes: 'Follow-up meeting on website requirements',
        },
      }),
    ]);

    console.log(`Created ${bookings.length} bookings`);

    // Create a subscription
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        planName: 'Professional Plan',
        pricePerMonth: 4900, // $49.00
        maxUsers: 10,
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1), // First day of last month
        isActive: true,
      },
    });

    console.log(`Created subscription: ${subscription.planName}`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
