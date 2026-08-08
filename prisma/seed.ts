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

  const modules = ['Products', 'Categories', 'Brands', 'Inventory', 'Analytics', 'Attributes', 'Users', 'Roles', 'Settings'];
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

  console.log('Seeding Roles...');

  // Helper to map permission names
  const getPermissionsByFilter = (filterFn: (p: { module: string; action: string }) => boolean) => {
    return createdPermissions.filter((p) => filterFn({ module: p.module, action: p.action }));
  };

  const rolesToSeed = [
    {
      name: 'SuperAdmin',
      description: 'Super Administrator with full unrestricted platform access',
      permissions: createdPermissions,
    },
    {
      name: 'Admin',
      description: 'System Administrator with standard administrative access',
      permissions: createdPermissions,
    },
    {
      name: 'InventoryManager',
      description: 'Manages products, variants, categories, brands, and warehouse stock',
      permissions: getPermissionsByFilter((p) =>
        ['Products', 'Categories', 'Brands', 'Inventory'].includes(p.module)
      ),
    },
    {
      name: 'MarketingManager',
      description: 'Manages promotional analytics, categories, and catalog view',
      permissions: getPermissionsByFilter(
        (p) =>
          ['Analytics'].includes(p.module) ||
          (['Products', 'Categories', 'Brands'].includes(p.module) && p.action === 'read')
      ),
    },
    {
      name: 'SupportAgent',
      description: 'Customer service agent with catalog and inventory view access',
      permissions: getPermissionsByFilter((p) => p.action === 'read'),
    },
    {
      name: 'Viewer',
      description: 'Read-only viewer for operational dashboards',
      permissions: getPermissionsByFilter((p) => p.action === 'read'),
    },
  ];

  let superAdminRole = null;

  for (const roleDef of rolesToSeed) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        description: roleDef.description,
        permissions: {
          set: roleDef.permissions.map((p) => ({ id: p.id })),
        },
      },
      create: {
        name: roleDef.name,
        description: roleDef.description,
        permissions: {
          connect: roleDef.permissions.map((p) => ({ id: p.id })),
        },
      },
    });

    if (roleDef.name === 'SuperAdmin') {
      superAdminRole = role;
    }
  }

  console.log('Seeding SuperAdmin User...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: passwordHash,
      roleId: superAdminRole!.id,
    },
    create: {
      email: adminEmail,
      passwordHash: passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: superAdminRole!.id,
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
