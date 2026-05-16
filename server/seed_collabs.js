const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log('No users found. Please register first.');
    return;
  }
  const user = users[0];

  const collab1 = await prisma.collab.create({
    data: {
      title: 'Music Video Production',
      description: 'Looking for a cinematographer for a high-budget music video shoot in Lagos.',
      budget: '₦200k - ₦500k',
      category: 'Film, TV, Video',
      location: 'Lagos',
      projectType: 'ONE_OFF',
      experienceLevel: 'PROFESSIONAL',
      posterId: user.id,
      status: 'OPEN'
    }
  });

  const collab2 = await prisma.collab.create({
    data: {
      title: 'UI/UX Designer for Fintech',
      description: 'Need a designer for a 3-month contract to revamp our mobile banking app.',
      budget: '₦300k/month',
      category: 'Design & Creative tech',
      location: 'Remote',
      projectType: 'RECURRING',
      experienceLevel: 'INTERMEDIATE',
      posterId: user.id,
      status: 'OPEN'
    }
  });

  console.log('Created sample collabs:', collab1.id, collab2.id);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
