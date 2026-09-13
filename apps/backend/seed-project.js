const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create Default Package
  let pkg = await prisma.package.findUnique({ where: { package_name: 'Default Unlimited' } });
  if (!pkg) {
    pkg = await prisma.package.create({
      data: {
        package_name: 'Default Unlimited',
        max_punch_items: null,
        pwa_enabled: true,
        report_enabled: true
      }
    });
  }

  // Create Default Project
  let proj = await prisma.project.findFirst({ where: { name: 'Default Project' } });
  if (!proj) {
    proj = await prisma.project.create({
      data: {
        name: 'Default Project',
        package_id: pkg.id
      }
    });
  }

  // Migrate existing users
  await prisma.user.updateMany({
    where: { project_id: null, role: { not: 'SUPERADMIN' } },
    data: { project_id: proj.id }
  });

  // Migrate existing punch items
  await prisma.punchItem.updateMany({
    where: { project_id: null },
    data: { project_id: proj.id }
  });

  console.log('Migration completed successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
