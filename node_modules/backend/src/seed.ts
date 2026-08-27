import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@company.com';
  const contractorEmail = 'contractor@company.com';

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: passwordHash,
        role: 'ADMIN'
      }
    });
    console.log('Created admin user: admin@company.com / password123');
  }

  // Check if contractor exists
  const existingContractor = await prisma.user.findUnique({ where: { email: contractorEmail } });
  
  if (!existingContractor) {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await prisma.user.create({
      data: {
        email: contractorEmail,
        password_hash: passwordHash,
        role: 'CONTRACTOR'
      }
    });
    console.log('Created contractor user: contractor@company.com / password123');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
