require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch() {
  try {
    const keyword = 'test';
    const [users, posts, collabs, circles] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: keyword, mode: 'insensitive' } },
            { displayName: { contains: keyword, mode: 'insensitive' } },
            { skills: { contains: keyword, mode: 'insensitive' } }
          ]
        },
        take: 2
      }),
      prisma.post.findMany({
        where: {
          content: { contains: keyword, mode: 'insensitive' },
          isArchived: false
        },
        take: 2
      }),
      prisma.collab.findMany({
        where: {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { category: { contains: keyword, mode: 'insensitive' } }
          ],
          status: 'OPEN'
        },
        take: 2
      }),
      prisma.circle.findMany({
        where: {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } }
          ]
        },
        take: 2
      })
    ]);
    console.log("Success:", { users: users.length, posts: posts.length, collabs: collabs.length, circles: circles.length });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch();
