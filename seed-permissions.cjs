const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const modules = ['CMS', 'Blog', 'SEO', 'Media', 'LandingPages', 'FAQ'];
  const actions = ['read', 'write', 'delete'];

  const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
  const superAdminRole = await prisma.role.findFirst({ where: { name: 'SuperAdmin' } });
  const marketingRole = await prisma.role.findFirst({ where: { name: 'MarketingManager' } });

  for (const mod of modules) {
    for (const action of actions) {
      let perm = await prisma.permission.findFirst({ where: { module: mod, action: action } });
      if (!perm) {
        perm = await prisma.permission.create({
          data: {
            name: `${mod}:${action}`,
            description: `Can ${action} ${mod}`,
            module: mod,
            action: action
          }
        });
      }

      const rolesToConnect = [adminRole?.id, superAdminRole?.id, marketingRole?.id].filter(Boolean);
      for (const roleId of rolesToConnect) {
        await prisma.role.update({
          where: { id: roleId },
          data: {
            permissions: {
              connect: { id: perm.id }
            }
          }
        });
      }
    }
  }

  console.log('Seeded permissions successfully');
}
seed().finally(() => prisma.$disconnect());
