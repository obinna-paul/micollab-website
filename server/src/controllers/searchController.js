const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json({ users: [], posts: [], collabs: [], circles: [] });
    }

    const keyword = q.trim();

    // Concurrent searches across models
    const [users, posts, collabs, circles] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: keyword, mode: 'insensitive' } },
            { displayName: { contains: keyword, mode: 'insensitive' } },
            { skills: { contains: keyword, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          profileImage: true,
          profileType: true,
          skills: true,
          location: true
        },
        take: 10
      }),
      prisma.post.findMany({
        where: {
          content: { contains: keyword, mode: 'insensitive' },
          isArchived: false
        },
        include: {
          creator: {
            select: { id: true, username: true, profileImage: true, profileType: true }
          },
          postLikes: { select: { userId: true } },
          _count: { select: { postComments: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
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
        include: {
          poster: {
            select: { id: true, username: true, profileImage: true, profileType: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.circle.findMany({
        where: {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } }
          ]
        },
        include: {
          _count: { select: { members: true } }
        },
        take: 10
      })
    ]);

    // Fire and forget search appearance tracking
    if (users.length > 0) {
      const today = new Date();
      today.setUTCHours(0,0,0,0);
      
      Promise.all(users.map(u => 
        prisma.profileAnalytics.upsert({
          where: { userId_date: { userId: u.id, date: today } },
          update: { searchAppears: { increment: 1 } },
          create: { userId: u.id, date: today, searchAppears: 1 }
        })
      )).catch(err => console.error('Search analytics tracking error:', err));
    }

    res.json({ users, posts, collabs, circles });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
};
