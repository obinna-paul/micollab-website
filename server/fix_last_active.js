require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLastActive() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    // Set lastActive to createdAt so they don't artificially bump DAU
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: user.createdAt }
    });
  }
  console.log('Fixed lastActive for all users.');
}

fixLastActive()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
