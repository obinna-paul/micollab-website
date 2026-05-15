const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIO } = require('../services/socketService');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tab } = req.query; // PRIMARY, REQUESTS, PROPOSALS

    let whereClause = {
      participants: { some: { userId } }
    };

    // Tab-specific filtering logic
    if (tab === 'PROPOSALS') {
      whereClause.type = 'PROPOSAL';
    } else if (tab === 'REQUESTS') {
      // In a more complex system, we'd check for connection status here
      // For now, let's assume 'DIRECT' covers both, and we'll refine later
      whereClause.type = 'DIRECT';
    } else {
      whereClause.type = 'DIRECT';
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
                profileType: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        proposalThread: {
          include: { collab: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } }
    });

    if (!participant) return res.status(403).json({ error: 'Unauthorized' });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, username: true, profileImage: true }
        },
        reactions: true,
        attachments: true,
        replyTo: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark as read
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() }
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, content, messageType, replyToId } = req.body;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        messageType: messageType || 'TEXT',
        replyToId
      },
      include: {
        sender: {
          select: { id: true, username: true, profileImage: true }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Emit to socket room
    const io = getIO();
    io.to(conversationId).emit('new_message', message);
    
    // Also notify individuals in case they aren't in the conversation room
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId }
    });
    participants.forEach(p => {
      if (p.userId !== userId) {
        io.to(p.userId).emit('message_notification', {
          conversationId,
          message: {
            ...message,
            content: message.content.substring(0, 50)
          }
        });
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId, type } = req.body;

    // For DIRECT messages, check if exists
    if (type === 'DIRECT' || !type) {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: { every: { userId: { in: [userId, targetUserId] } } },
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: targetUserId } } }
          ]
        },
        include: { id: true }
      });

      if (existing) return res.json(existing);
    }

    // Create new
    const conversation = await prisma.conversation.create({
      data: {
        type: type || 'DIRECT',
        participants: {
          create: [
            { userId },
            { userId: targetUserId }
          ]
        }
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};
