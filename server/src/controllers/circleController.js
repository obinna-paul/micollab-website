const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationController = require('./notificationController');

// POST /api/circles - Create a new collaboration circle
exports.createCircle = async (req, res) => {
  try {
    const { title, description, category, coverImage, visibility, compensationType, collabId } = req.body;
    const ownerId = req.user.id;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7);

    const circle = await prisma.circle.create({
      data: {
        title,
        slug,
        description: description || null,
        category,
        coverImage: coverImage || null,
        visibility: visibility || 'PRIVATE',
        compensationType: compensationType || 'NONE',
        ownerId,
        collabId: collabId || null,
        members: {
          create: [{ userId: ownerId, role: 'OWNER' }]
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, profileImage: true, profileType: true } }
          }
        },
        _count: { select: { members: true } }
      }
    });

    res.status(201).json(circle);
  } catch (error) {
    console.error('Error creating circle:', error);
    res.status(500).json({ error: 'Failed to create circle' });
  }
};

// GET /api/circles - Get my circles
exports.getMyCircles = async (req, res) => {
  try {
    const userId = req.user.id;

    const circles = await prisma.circle.findMany({
      where: {
        members: { some: { userId } }
      },
      include: {
        owner: { select: { username: true, profileImage: true } },
        _count: { select: { members: true, tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(circles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch circles' });
  }
};

// GET /api/circles/:id - Get detailed circle info
exports.getCircleDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const circle = await prisma.circle.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, profileImage: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, profileImage: true, profileType: true } }
          }
        },
        tasks: {
          include: { assignee: { select: { username: true, profileImage: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { username: true, profileImage: true } } }
        },
        milestones: { orderBy: { deadline: 'asc' } },
        files: { take: 5, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!circle) return res.status(404).json({ error: 'Circle not found' });

    // Check access
    const isMember = circle.members.some(m => m.userId === userId);
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    res.json(circle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      error: 'Failed to fetch circle details', 
      details: error.message, 
      stack: error.stack 
    });
  }
};

// POST /api/circles/:id/invite - Invite a member
exports.inviteMember = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const { inviteeId } = req.body;
    const inviterId = req.user.id;

    const circle = await prisma.circle.findUnique({ 
      where: { id: circleId },
      include: { members: true }
    });

    if (!circle) return res.status(404).json({ error: 'Circle not found' });

    // Only owner or admin can invite
    const inviterMember = circle.members.find(m => m.userId === inviterId);
    if (!inviterMember || (inviterMember.role !== 'OWNER' && inviterMember.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Check if already a member
    if (circle.members.some(m => m.userId === inviteeId)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Create invitation
    const invitation = await prisma.circleInvitation.create({
      data: { circleId, inviterId, inviteeId }
    });

    // Notify invitee
    await notificationController.createNotification(
      inviteeId,
      inviterId,
      'CIRCLE_INVITE',
      'Circle Invitation',
      `invited you to join the circle: ${circle.title}`,
      `/circles/${circleId}`
    );

    res.status(201).json(invitation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
};

// PATCH /api/circles/invites/:inviteId - Respond to invite
exports.respondToInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { status } = req.body; // ACCEPTED or REJECTED
    const userId = req.user.id;

    const invitation = await prisma.circleInvitation.findUnique({
      where: { id: inviteId },
      include: { circle: true }
    });

    if (!invitation || invitation.inviteeId !== userId) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (status === 'ACCEPTED') {
      // 1. Update invitation
      await prisma.circleInvitation.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED' }
      });

      // 2. Add to members
      await prisma.circleMember.create({
        data: {
          circleId: invitation.circleId,
          userId,
          role: 'CONTRIBUTOR'
        }
      });

      // 3. Notify owner
      await notificationController.createNotification(
        invitation.inviterId,
        userId,
        'CIRCLE_JOINED',
        'Invitation Accepted',
        `joined your circle: ${invitation.circle.title}`,
        `/circles/${invitation.circleId}`
      );
    } else {
      await prisma.circleInvitation.update({
        where: { id: inviteId },
        data: { status: 'REJECTED' }
      });
    }

    res.json({ message: `Invitation ${status.toLowerCase()}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to respond to invitation' });
  }
};

// POST /api/circles/:id/messages - Send message
exports.sendCircleMessage = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const { content, type } = req.body;
    const senderId = req.user.id;

    const message = await prisma.circleMessage.create({
      data: {
        circleId,
        senderId,
        content,
        type: type || 'TEXT'
      },
      include: { sender: { select: { username: true, profileImage: true } } }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
