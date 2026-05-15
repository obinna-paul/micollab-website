const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ select: { email: true, username: true } });
  console.log('Total Users:', users.length);
  console.log('User List:', users);
  process.exit(0);
}

check();
