require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.user.findFirst({
      where: { username: { equals: 'micollab', mode: 'insensitive' } },
      include: {
        posts: {
          where: { isCollabCard: false, isArchived: false },
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { username: true, profileImage: true, profileType: true, isVerified: true } },
            originalPost: {
              include: {
                creator: { select: { username: true, profileImage: true, profileType: true, isVerified: true } }
              }
            }
          }
        },
        portfolioItems: {
          orderBy: { createdAt: 'desc' },
          include: {
            media: { orderBy: { order: 'asc' } },
            tags: true,
            credits: {
              include: {
                user: { select: { username: true, profileImage: true, profileType: true, isVerified: true } }
              }
            }
          }
        },
        _count: {
          select: {
            sentRequests: { where: { status: 'ACCEPTED' } },
            receivedRequests: { where: { status: 'ACCEPTED' } },
            collabs: true
          }
        },
        receivedTestimonials: {
          orderBy: { createdAt: 'desc' },
          include: {
            fromUser: { select: { username: true, profileImage: true, profileType: true } }
          }
        }
      }
    });
    console.log('Success');
  } catch(e) {
    console.log(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
