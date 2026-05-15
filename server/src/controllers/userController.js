const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        posts: {
          where: { isCollabCard: false },
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { username: true, profileImage: true, profileType: true, isVerified: true } },
            _count: { select: { likes: true, comments: true } }
          }
        },
        portfolioItems: { orderBy: { createdAt: 'desc' } },
        experiences: { orderBy: { startDate: 'desc' } },
        _count: {
          select: {
            sentRequests: { where: { status: 'ACCEPTED' } },
            receivedRequests: { where: { status: 'ACCEPTED' } }
          }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const connectionsCount = (user._count.sentRequests || 0) + (user._count.receivedRequests || 0);
    const { passwordHash, _count, ...userData } = user;
    res.json({ ...userData, connectionsCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, profileType, location, skills, creativeMission, availability, profileImage } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(bio !== undefined && { bio }),
        ...(profileType !== undefined && { profileType }),
        ...(location !== undefined && { location }),
        ...(skills !== undefined && { skills }),
        ...(creativeMission !== undefined && { creativeMission }),
        ...(availability !== undefined && { availability }),
        ...(profileImage !== undefined && { profileImage })
      },
      select: {
        id: true, username: true, email: true, profileType: true,
        profileImage: true, bio: true, location: true, skills: true,
        creativeMission: true, availability: true
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.createPortfolioItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, mediaUrl, caption } = req.body;

    const newItem = await prisma.portfolioItem.create({
      data: { title, mediaUrl, caption, mediaType: 'IMAGE', creatorId: userId }
    });
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create portfolio item' });
  }
};

exports.createExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, role, startDate, endDate, description, location } = req.body;

    const newExp = await prisma.experience.create({
      data: { company, role, startDate, endDate, description, location, userId }
    });
    res.json(newExp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create experience' });
  }
};

exports.getTrendingCreators = async (req, res) => {
  try {
    const creators = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, profileImage: true, profileType: true, isVerified: true }
    });
    res.json(creators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending creators' });
  }
};
