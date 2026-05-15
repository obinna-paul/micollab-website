const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getProfile = async (req, res) => {
  try {
    const { username: rawUsername } = req.params;
    const username = rawUsername.toLowerCase();
    console.log(`[DEBUG] Fetching profile for username: "${username}"`);
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        posts: {
          where: { isCollabCard: false },
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { username: true, profileImage: true, profileType: true, isVerified: true } }
          }
        },
        portfolioItems: { orderBy: { createdAt: 'desc' } },
        _count: {
          select: {
            sentRequests: { where: { status: 'ACCEPTED' } },
            receivedRequests: { where: { status: 'ACCEPTED' } }
          }
        }
      }
    });

    if (!user) {
      console.log(`[DEBUG] User "${username}" NOT FOUND in database`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[DEBUG] User "${username}" found! Returning data...`);
    const connectionsCount = (user._count?.sentRequests || 0) + (user._count?.receivedRequests || 0);
    const { password: passwordHash, _count, ...userData } = user;
    res.json({ ...userData, connectionsCount });
  } catch (error) {
    console.error(`[DEBUG] Error fetching profile for ${req.params.username}:`, error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      displayName, bio, longAbout, location, 
      skills, availabilityStatus, profileImage, 
      coverImage, socialLinks 
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(longAbout !== undefined && { longAbout }),
        ...(location !== undefined && { location }),
        ...(skills !== undefined && { skills }),
        ...(availabilityStatus !== undefined && { availabilityStatus }),
        ...(profileImage !== undefined && { profileImage }),
        ...(coverImage !== undefined && { coverImage }),
        ...(socialLinks !== undefined && { socialLinks: JSON.stringify(socialLinks) })
      }
    });

    const { password: _, ...userData } = updated;
    res.json(userData);
  } catch (error) {
    console.error(error);
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
