import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required to seed the admin user.');
  }

  const modules = ['Products', 'Categories', 'Brands', 'Inventory', 'Analytics'];
  const actions = ['read', 'write', 'delete'];

  console.log('Seeding Permissions...');

  const createdPermissions = [];
  for (const mod of modules) {
    for (const action of actions) {
      const permissionName = `${action}_${mod.toLowerCase()}`;
      const permission = await prisma.permission.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          module: mod,
          action: action,
          description: `Can ${action} ${mod.toLowerCase()}`,
        },
      });
      createdPermissions.push({ id: permission.id });
    }
  }

  console.log('Seeding Admin Role...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {
      permissions: {
        set: createdPermissions,
      },
    },
    create: {
      name: 'Admin',
      description: 'System Administrator',
      permissions: {
        connect: createdPermissions,
      },
    },
  });

  console.log('Seeding Admin User...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: passwordHash,
      roleId: adminRole.id,
    },
    create: {
      email: adminEmail,
      passwordHash: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log(`Admin User seeded successfully: ${adminUser.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
