import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.punchItem.findMany({ select: { running_no: true, before_image_path: true, after_image_path: true } });
  console.log('Items:', items);
}

main().finally(() => prisma.$disconnect());
