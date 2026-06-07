require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { username: 'micollab' } });
  if (user) {
    await prisma.portfolioItem.deleteMany({ where: { userId: user.id } });
    console.log("Deleted portfolio items for micollab");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
