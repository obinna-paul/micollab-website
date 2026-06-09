const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeSuperAdmin() {
  try {
    const user = await prisma.user.updateMany({
      where: { email: 'ezeodilipaul@gmail.com' },
      data: { isAdmin: true, isSuperAdmin: true }
    });
    console.log(`Updated ${user.count} user(s) to Super Admin status.`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

makeSuperAdmin();
