const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

exports.getProfile = async (req, res) => {
  try {
    const { username: rawUsername } = req.params;
    const username = rawUsername.toLowerCase();
    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: rawUsername,
          mode: 'insensitive'
        }
      },
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
        testimonials: { 
          orderBy: { createdAt: 'desc' },
          include: {
            fromUser: { select: { username: true, profileImage: true, profileType: true } }
          }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const viewerId = req.user?.id;
    if (viewerId !== user.id) {
      const today = new Date();
      today.setUTCHours(0,0,0,0);
      prisma.profileAnalytics.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        update: { views: { increment: 1 } },
        create: { userId: user.id, date: today, views: 1 }
      }).catch(err => console.error('Analytics tracking error:', err));
    }

    const connectionsCount = (user._count?.sentRequests || 0) + (user._count?.receivedRequests || 0);
    const collabsCount = user._count?.collabs || 0;
    const { password: _, _count, testimonials, ...userData } = user;
    res.json({ ...userData, connectionsCount, followersCount: connectionsCount, collabsCount, receivedTestimonials: testimonials, mutualConnections: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      displayName, bio, longAbout, location, 
      skills, availabilityStatus, profileImage, 
      coverImage, socialLinks, website, profileType 
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
        ...(website !== undefined && { website }),
        ...(profileType !== undefined && { profileType }),
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

exports.createTestimonial = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId, content, rating } = req.body;

    if (!toUserId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'Cannot endorse yourself' });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        fromUserId,
        toUserId,
        content,
        rating: rating || 5
      },
      include: {
        fromUser: { select: { username: true, profileImage: true, profileType: true } }
      }
    });

    res.status(201).json(testimonial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
};

exports.createPortfolioItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, category, projectType, date, featured, media, tags, credits } = req.body;

    // media: Array of { url, type, order }
    // tags: Array of strings
    // credits: Array of { userId, role }

    console.log('[DEBUG] createPortfolioItem Body:', JSON.stringify(req.body, null, 2));
    const newItem = await prisma.portfolioItem.create({
      data: {
        title,
        description,
        category,
        projectType: projectType || 'PERSONAL',
        date: date ? new Date(date) : null,
        featured: featured || false,
        userId,
        media: {
          create: media.map(m => ({
            url: m.url,
            type: m.type || 'IMAGE',
            order: m.order || 0
          }))
        },
        tags: {
          create: (tags || []).map(name => ({ name }))
        },
        credits: {
          create: (credits || []).map(c => ({
            creditedUserId: c.userId,
            role: c.role
          }))
        }
      },
      include: {
        media: true,
        tags: true,
        credits: {
          include: {
            user: { select: { username: true, profileImage: true, profileType: true } }
          }
        }
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('[PORTFOLIO_ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to create portfolio item', 
      details: error.message,
      code: error.code 
    });
  }
};

exports.getWalletMetrics = async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) return res.json({ availableBalance: 0, escrowBalance: 0 });
    res.json(wallet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch wallet metrics' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const analytics = await prisma.profileAnalytics.findMany({
      where: {
        userId,
        date: { in: [today, yesterday] }
      }
    });

    const todayStats = analytics.find(a => a.date.getTime() === today.getTime()) || { views: 0, searchAppears: 0 };
    const yesterdayStats = analytics.find(a => a.date.getTime() === yesterday.getTime()) || { views: 0, searchAppears: 0 };

    const calculateGrowth = (todayCount, yesterdayCount) => {
      if (yesterdayCount === 0) return todayCount > 0 ? 100 : 0;
      return Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
    };

    res.json({
      today: {
        views: todayStats.views,
        searchAppears: todayStats.searchAppears
      },
      yesterday: {
        views: yesterdayStats.views,
        searchAppears: yesterdayStats.searchAppears
      },
      growth: {
        views: calculateGrowth(todayStats.views, yesterdayStats.views),
        searchAppears: calculateGrowth(todayStats.searchAppears, yesterdayStats.searchAppears)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
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

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { displayName: { contains: query } }
        ]
      },
      take: 10,
      select: { id: true, username: true, displayName: true, profileImage: true, profileType: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search users' });
  }
};

exports.createExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, role, startDate, endDate, description, location } = req.body;

    const newExp = await prisma.experience.create({
      data: { company, role, startDate, endDate: endDate ? new Date(endDate) : null, description, location, userId }
    });
    res.json(newExp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create experience' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Check if user is a freelancer in an active Collab with escrow
    const activeFreelanceWork = await prisma.proposal.findFirst({
      where: {
        userId: userId,
        status: 'ACCEPTED',
        escrowStatus: { in: ['HELD', 'DISPUTED'] }
      }
    });

    // 2. Check if user is a client in an active Collab with escrow
    const activeClientWork = await prisma.collab.findFirst({
      where: {
        posterId: userId,
        proposals: {
          some: {
            status: 'ACCEPTED',
            escrowStatus: { in: ['HELD', 'DISPUTED'] }
          }
        }
      }
    });

    // 3. Check if user is the owner of an active Circle
    const activeCircle = await prisma.circle.findFirst({
      where: {
        ownerId: userId,
        status: 'ACTIVE'
      }
    });

    if (activeFreelanceWork || activeClientWork || activeCircle) {
      return res.status(400).json({ 
        error: 'Cannot delete account. You have an ongoing collab, active circle project, or an active dispute. Please settle them first.' 
      });
    }

    // If no blocking conditions, delete the account.
    // Because of onDelete: Cascade in the Prisma schema, all related records will be automatically deleted.
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('[DELETE_ACCOUNT_ERROR]', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

exports.activityPing = async (req, res) => {
  try {
    const userId = req.user.id;
    // We assume the frontend pings every 60 seconds
    const PING_INTERVAL_SECONDS = 60;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActive: new Date(),
        totalTimeSpent: {
          increment: PING_INTERVAL_SECONDS
        }
      }
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('[ACTIVITY_PING_ERROR]', err);
    res.status(500).json({ error: 'Failed to ping activity' });
  }
};
