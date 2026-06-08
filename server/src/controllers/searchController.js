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
            { name: { contains: keyword, mode: 'insensitive' } },
            { specializations: { contains: keyword, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
          profileType: true,
          specializations: true,
          location: true
        },
        take: 10
      }),
      prisma.post.findMany({
        where: {
          content: { contains: keyword, mode: 'insensitive' },
          archived: false
        },
        include: {
          author: {
            select: { id: true, username: true, profileImage: true, profileType: true }
          },
          likes: { select: { userId: true } },
          _count: { select: { comments: true } }
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
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } }
          ]
        },
        include: {
          _count: { select: { members: true } }
        },
        take: 10
      })
    ]);

    res.json({ users, posts, collabs, circles });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
};
