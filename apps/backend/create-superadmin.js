const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const exists = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
  if (!exists) {
    const hash = await bcrypt.hash('superadmin123', 10);
    await prisma.user.create({
      data: {
        email: 'superadmin@pim.com',
        password_hash: hash,
        name: 'System Superadmin',
        role: 'SUPERADMIN'
      }
    });
    console.log('Created Superadmin: superadmin@pim.com / superadmin123');
  } else {
    console.log('Superadmin exists: ' + exists.email);
  }
}

main().finally(() => prisma.$disconnect());
