const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationController = require('./notificationController');

// GET /api/network/discover - Find new people to connect with
exports.discoverUsers = async (req, res) => {
  try {
    const { search, profileType } = req.query;
    const currentUserId = req.user.id;

    // Get current user profile for matching
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { profileType: true, skills: true }
    });
    const mySkills = currentUser?.skills ? currentUser.skills.split(',').map(s => s.trim()) : [];

    // Get my sent requests
    const sentRequests = await prisma.connectionRequest.findMany({
      where: { fromUserId: currentUserId, status: 'PENDING' },
      select: { toUserId: true }
    });
    const requestedUserIds = new Set(sentRequests.map(r => r.toUserId));

    // Get my active connections
    const myConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { userId: currentUserId, status: 'ACCEPTED' },
          { connectedId: currentUserId, status: 'ACCEPTED' }
        ]
      }
    });
    const connectedUserIds = new Set(myConnections.map(c => c.userId === currentUserId ? c.connectedId : c.userId));

    let users = await prisma.user.findMany({
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
      take: 50 // take more to allow meaningful sorting
    });

    // Add status property and match score to each user
    let usersWithStatus = users.map(u => {
      let matchScore = 0;
      const uSkills = u.skills ? u.skills.split(',').map(s => s.trim()) : [];
      
      if (currentUser) {
        if (u.profileType === currentUser.profileType) matchScore += 30;
        const overlap = uSkills.filter(s => mySkills.includes(s)).length;
        matchScore += overlap * 20; // 20 points per overlapping specialization
      }

      return {
        ...u,
        connectionStatus: connectedUserIds.has(u.id) ? 'CONNECTED' : requestedUserIds.has(u.id) ? 'PENDING' : 'NONE',
        _matchScore: matchScore
      };
    });

    // Sort by highest match score
    usersWithStatus.sort((a, b) => b._matchScore - a._matchScore);
    
    // Return top 20 after sorting
    res.json(usersWithStatus.slice(0, 20));
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

    const existingRequest = await prisma.connectionRequest.findFirst({
      where: {
        status: 'PENDING',
        OR: [
          { fromUserId: requesterId, toUserId: receiverId },
          { fromUserId: receiverId, toUserId: requesterId }
        ]
      }
    });

    if (existingRequest) {
      if (existingRequest.fromUserId === receiverId) {
        // They already sent us a request, so accept it!
        await prisma.connectionRequest.update({
          where: { id: existingRequest.id },
          data: { status: 'ACCEPTED' }
        });
        
        await prisma.connection.create({
          data: {
            userId: requesterId,
            connectedId: receiverId,
            status: 'ACCEPTED'
          }
        });

        await notificationController.createNotification(
          receiverId,
          requesterId,
          'CONNECTION',
          'Connection Accepted',
          existingRequest.id
        );

        return res.json({ message: 'Request accepted', status: 'CONNECTED' });
      }
      return res.status(400).json({ error: 'Connection request already exists' });
    }
    
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId: requesterId, connectedId: receiverId },
          { userId: receiverId, connectedId: requesterId }
        ]
      }
    });

    if (existingConnection) {
      return res.status(400).json({ error: 'Already connected' });
    }

    const request = await prisma.connectionRequest.create({
      data: {
        fromUserId: requesterId,
        toUserId: receiverId,
        status: 'PENDING'
      }
    });

    // Notify receiver
    await notificationController.createNotification(
      receiverId,
      requesterId,
      'CONNECTION',
      'New Connection Request',
      request.id
    );

    res.json(request);
  } catch (error) {
    console.error("FATAL ERROR IN sendConnectionRequest:", error);
    res.status(500).json({ error: 'Failed to send request', details: error.message });
  }
};

// GET /api/network/requests - Get pending requests
exports.getRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.connectionRequest.findMany({
      where: {
        toUserId: userId,
        status: 'PENDING'
      },
      include: {
        fromUser: {
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
    const { action } = req.body; // ACCEPTED or DECLINED
    const userId = req.user.id;

    const request = await prisma.connectionRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || request.toUserId !== userId) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status === 'ACCEPTED') {
      return res.json({ message: 'Already accepted' });
    }

    if (action === 'ACCEPTED') {
      const updated = await prisma.connectionRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });
      
      await prisma.connection.create({
        data: {
          userId: request.fromUserId,
          connectedId: request.toUserId,
          status: 'ACCEPTED'
        }
      });

      // Notify requester
      await notificationController.createNotification(
        request.fromUserId,
        userId,
        'CONNECTION',
        'Connection Accepted',
        request.id
      );

      return res.json(updated);
    } else {
      await prisma.connectionRequest.delete({
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
          { userId: userId, status: 'ACCEPTED' },
          { connectedId: userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        user: {
          select: { id: true, username: true, profileImage: true, profileType: true, isVerified: true }
        },
        connectedTo: {
          select: { id: true, username: true, profileImage: true, profileType: true, isVerified: true }
        }
      }
    });

    // Map to get the other user's info
    const network = connections.map(c => c.userId === userId ? c.connectedTo : c.user);

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
          { userId: userId, status: 'ACCEPTED' },
          { connectedId: userId, status: 'ACCEPTED' }
        ]
      }
    });

    const friendIds = connections.map(c => c.userId === userId ? c.connectedId : c.userId);
    
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

// GET /api/network/status/:targetId - Get connection status with another user
exports.getConnectionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;

    if (userId === targetId) return res.json({ status: 'SELF' });

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId: userId, connectedId: targetId },
          { userId: targetId, connectedId: userId }
        ],
        status: 'ACCEPTED'
      }
    });

    if (connection) {
      return res.json({ status: 'CONNECTED' });
    }

    const request = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: targetId },
          { fromUserId: targetId, toUserId: userId }
        ],
        status: 'PENDING'
      }
    });

    if (request) {
      if (request.fromUserId === userId) {
        return res.json({ status: 'REQUESTED' });
      } else {
        return res.json({ status: 'RECEIVED_REQUEST' });
      }
    }

    res.json({ status: 'NONE' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch connection status' });
  }
};

// DELETE /api/network/connections/:targetId - Unfollow/Disconnect
exports.removeConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;

    // Delete connection
    await prisma.connection.deleteMany({
      where: {
        OR: [
          { userId: userId, connectedId: targetId },
          { userId: targetId, connectedId: userId }
        ]
      }
    });

    // Also delete any existing requests between them to completely reset state
    await prisma.connectionRequest.deleteMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: targetId },
          { fromUserId: targetId, toUserId: userId }
        ]
      }
    });

    res.json({ message: 'Disconnected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
};
