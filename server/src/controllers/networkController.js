const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationController = require('./notificationController');

// GET /api/network/discover - Find new people to connect with
exports.discoverUsers = async (req, res) => {
  try {
    const { search, profileType } = req.query;
    const currentUserId = req.user.id;

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        ...(search && {
          OR: [
            { username: { contains: search } },
            { bio: { contains: search } },
            { skills: { contains: search } }
          ]
        }),
        ...(profileType && { profileType })
      },
      select: {
        id: true,
        username: true,
        profileImage: true,
        profileType: true,
        bio: true,
        skills: true,
        location: true,
        isVerified: true
      },
      take: 20
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to discover users' });
  }
};

// POST /api/network/connect - Send connection request
exports.sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const requesterId = req.user.id;

    if (requesterId === receiverId) {
      return res.status(400).json({ error: 'You cannot connect with yourself' });
    }

    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Connection or request already exists' });
    }

    const connection = await prisma.connection.create({
      data: {
        requesterId,
        receiverId,
        status: 'PENDING'
      }
    });

    // Notify receiver
    await notificationController.createNotification(
      receiverId,
      requesterId,
      'CONNECTION',
      'New Connection Request',
      `wants to connect with you.`,
      '/network'
    );

    res.json(connection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send request' });
  }
};

// GET /api/network/requests - Get pending requests
exports.getRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.connection.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            profileType: true
          }
        }
      }
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// PATCH /api/network/requests/:requestId - Accept or decline
exports.handleConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // ACCEPTED or DECLINED (deleted)
    const userId = req.user.id;

    const request = await prisma.connection.findUnique({
      where: { id: requestId }
    });

    if (!request || request.receiverId !== userId) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (action === 'ACCEPTED') {
      const updated = await prisma.connection.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });

      // Notify requester
      await notificationController.createNotification(
        request.requesterId,
        userId,
        'CONNECTION',
        'Connection Accepted',
        `accepted your connection request!`,
        `/profile/${req.user.username}`
      );

      return res.json(updated);
    } else {
      await prisma.connection.delete({
        where: { id: requestId }
      });
      return res.json({ message: 'Request declined' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to handle request' });
  }
};

// GET /api/network/connections - Get all mutual connections
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user.id;

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        requester: {
          select: { id: true, username: true, profileImage: true, profileType: true, isVerified: true }
        },
        receiver: {
          select: { id: true, username: true, profileImage: true, profileType: true, isVerified: true }
        }
      }
    });

    // Map to get the other user's info
    const network = connections.map(c => c.requesterId === userId ? c.receiver : c.requester);

    res.json(network);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch network' });
  }
};

// GET /api/network/feed - Posts from your network
exports.getNetworkFeed = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get connection IDs
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
        ]
      }
    });

    const friendIds = connections.map(c => c.requesterId === userId ? c.receiverId : c.requesterId);
    
    // Include the user's own posts too
    const targetIds = [...friendIds, userId];

    const posts = await prisma.post.findMany({
      where: {
        creatorId: { in: targetIds },
        isArchived: false
      },
      include: {
        creator: {
          select: {
            username: true,
            profileImage: true,
            profileType: true,
            isVerified: true
          }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch network feed' });
  }
};
