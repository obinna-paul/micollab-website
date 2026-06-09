const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    const user = await prisma.user.updateMany({
      where: { username: 'micollab' },
      data: { isAdmin: true }
    });
    console.log(`Updated ${user.count} user(s) to Admin status.`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
