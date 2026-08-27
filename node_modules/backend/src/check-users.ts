import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import bcrypt from 'bcryptjs';

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
  
  if (users.length > 0) {
    const isMatch = await bcrypt.compare('password123', users[0].password_hash);
    console.log('Does password123 match hash for user 1?', isMatch);
  }
}

main().finally(() => prisma.$disconnect());
