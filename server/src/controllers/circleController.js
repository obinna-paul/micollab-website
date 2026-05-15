const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationController = require('./notificationController');

// POST /api/circles - Create a new collaboration circle
exports.createCircle = async (req, res) => {
  console.log('Backend: createCircle request received', req.body);
  try {
    const { name, description, duration, startDate, initialInvites } = req.body;
    const leadId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Circle name is required' });
    }

    // 1. Initialize the Group Chat FIRST
    const conversation = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        participants: {
          create: [
            {
              userId: leadId,
              role: 'LEAD'
            }
          ]
        }
      }
    });

    // 2. Create the Circle and link the conversation
    const circle = await prisma.circle.create({
      data: {
        name,
        description,
        duration,
        startDate: startDate ? new Date(startDate) : null,
        leadId,
        conversationId: conversation.id,
        members: {
          create: [
            {
              userId: leadId,
              role: 'LEAD'
            }
          ]
        }
      },
      include: {
        lead: { select: { username: true, profileImage: true } },
        members: {
          include: {
            user: { select: { username: true, profileImage: true } }
          }
        },
        invitations: {
          include: {
            invitee: { select: { username: true, profileImage: true } }
          }
        },
        _count: { select: { members: true } }
      }
    });

    // 3. Send initial recruitment invitations if any
    if (initialInvites && initialInvites.length > 0) {
      const invites = initialInvites.map(inviteeId => ({
        circleId: circle.id,
        inviteeId,
        inviterId: leadId,
        status: 'PENDING'
      }));
      await prisma.circleInvitation.createMany({
        data: invites
      });
    }

    console.log('Backend: Circle created successfully', circle.id);
    res.json(circle);
  } catch (error) {
    console.error('Backend: Error creating circle', error);
    res.status(500).json({ error: error.message || 'Failed to create circle' });
  }
};

// GET /api/circles - Get my circles (lead or member)
exports.getMyCircles = async (req, res) => {
  try {
    const userId = req.user.id;

    const circles = await prisma.circle.findMany({
      where: {
        OR: [
          { leadId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        lead: { select: { username: true, profileImage: true } },
        _count: { select: { members: true } },
        members: {
          include: {
            user: { select: { username: true, profileImage: true } }
          }
        }
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
        lead: { select: { username: true, profileImage: true, profileType: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, profileImage: true, profileType: true, isVerified: true } }
          }
        },
        invitations: {
          where: { status: 'PENDING' },
          include: {
            invitee: { select: { username: true, profileImage: true } }
          }
        },
        conversation: {
          include: {
            messages: {
              take: 50,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: { select: { username: true, profileImage: true } }
              }
            }
          }
        }
      }
    });

    if (!circle) return res.status(404).json({ error: 'Circle not found' });

    // Check if user is part of circle
    const isMember = circle.members.some(m => m.userId === userId);
    if (!isMember && circle.leadId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(circle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch circle details' });
  }
};

// POST /api/circles/:id/invite - Recruit someone from network
exports.inviteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { inviteeId } = req.body;
    const inviterId = req.user.id;

    const circle = await prisma.circle.findUnique({ where: { id } });
    if (!circle || circle.leadId !== inviterId) {
      return res.status(403).json({ error: 'Only the lead can invite members' });
    }

    // Check if already a member
    const existingMember = await prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: id, userId: inviteeId } }
    });
    if (existingMember) return res.status(400).json({ error: 'User is already a member' });

    const invite = await prisma.circleInvitation.create({
      data: {
        circleId: id,
        inviteeId,
        inviterId,
        status: 'PENDING'
      }
    });

    // Notify invitee
    await notificationController.createNotification(
      inviteeId,
      inviterId,
      'CIRCLE',
      'Circle Invitation',
      `invited you to join the circle: ${circle.name}`,
      `/circles/${id}`
    );

    res.json(invite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
};

// PATCH /api/circles/invites/:inviteId - Accept or Reject Circle Invitation
exports.respondToInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { status } = req.body; // ACCEPTED or REJECTED
    const userId = req.user.id;

    const invite = await prisma.circleInvitation.findUnique({
      where: { id: inviteId }
    });

    if (!invite || invite.inviteeId !== userId) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (status === 'ACCEPTED') {
      // 1. Update invite status
      await prisma.circleInvitation.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED' }
      });

      // 2. Add to Circle Members
      await prisma.circleMember.create({
        data: {
          circleId: invite.circleId,
          userId,
          role: 'MEMBER'
        }
      });

      // 3. Add to Conversation
      const circle = await prisma.circle.findUnique({ where: { id: invite.circleId } });
      if (circle.conversationId) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: circle.conversationId,
            userId,
            role: 'MEMBER'
          }
        });
      }

      res.json({ message: 'Welcome to the circle!' });

      // Notify inviter/lead
      await notificationController.createNotification(
        invite.inviterId,
        userId,
        'CIRCLE',
        'Circle Invitation Accepted',
        `joined your circle: ${circle.name}`,
        `/circles/${circle.id}`
      );
    } else {
      await prisma.circleInvitation.update({
        where: { id: inviteId },
        data: { status: 'REJECTED' }
      });
      res.json({ message: 'Invitation declined' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to respond to invite' });
  }
};
