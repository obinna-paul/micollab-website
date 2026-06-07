require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserExists() {
  const email = 'swipeupdating@gmail.com';
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  
  if (user) {
    console.log("User found:", user.email, "Verified:", user.isEmailVerified);
  } else {
    console.log("User NOT found for email:", email);
  }
}

testUserExists().catch(console.error).finally(() => prisma.$disconnect());
