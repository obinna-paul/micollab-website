const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIO, isUserOnline } = require('../services/socketService');
const { sendUnreadMessageEmail } = require('../utils/emailService');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tab } = req.query; // PRIMARY, REQUESTS, PROPOSALS

    let whereClause = {
      participants: { some: { userId } }
    };

    // Get blocked users
    const blocks = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }]
      }
    });
    const blockedUserIds = new Set(
      blocks.map(b => b.blockerId === userId ? b.blockedId : b.blockerId)
    );

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
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // In-memory filter for DIRECT vs REQUESTS
    // We check the Connection table for each conversation
    const connectedUsersQuery = await prisma.connection.findMany({
      where: {
        OR: [
          { userId },
          { connectedId: userId }
        ],
        status: 'ACCEPTED'
      }
    });

    const connectedUserIds = new Set();
    connectedUsersQuery.forEach(c => {
      connectedUserIds.add(c.userId === userId ? c.connectedId : c.userId);
    });

    const filteredConversations = conversations.filter(conv => {
      const partner = conv.participants.find(p => p.userId !== userId);
      if (!partner) return false;
      
      // Filter out blocked users
      if (blockedUserIds.has(partner.userId)) return false;

      const isConnected = connectedUserIds.has(partner.userId);
      
      if (tab === 'REQUESTS') {
        return !isConnected;
      } else {
        return isConnected;
      }
    });

    res.json(filteredConversations);
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
      orderBy: { createdAt: 'asc' }
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
    const { conversationId, content, mediaUrl, mediaType } = req.body;

    // Check if conversation involves a blocked user
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId }
    });
    const partner = participants.find(p => p.userId !== userId);

    if (partner) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: partner.userId },
            { blockerId: partner.userId, blockedId: userId }
          ]
        }
      });
      if (block) {
        return res.status(403).json({ error: 'Cannot send message. User is blocked.' });
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content || '',
        mediaUrl,
        mediaType
      }
    });

    // Fetch sender info manually to mimic include
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, profileImage: true }
    });
    
    const messageWithSender = { ...message, sender };

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Emit to socket room
    const io = getIO();
    io.to(conversationId).emit('new_message', messageWithSender);
    
    // Also notify individuals in case they aren't in the conversation room
    // Also notify individuals in case they aren't in the conversation room
    // and send offline emails
    for (const p of participants) {
      if (p.userId !== userId) {
        // Live socket notification
        io.to(p.userId).emit('message_notification', {
          conversationId,
          message: {
            ...messageWithSender,
            content: messageWithSender.content.substring(0, 50)
          }
        });

        // Offline email trigger
        const isOnline = await isUserOnline(p.userId);
        if (!isOnline) {
          const partnerUser = await prisma.user.findUnique({
            where: { id: p.userId },
            select: { email: true }
          });
          if (partnerUser && partnerUser.email) {
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            sendUnreadMessageEmail(
              partnerUser.email,
              sender.username,
              messageWithSender.content || (mediaUrl ? '[Media Attachment]' : 'New message'),
              `${clientUrl}/messages`
            );
          }
        }
      }
    }

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    // Check for block
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: userId }
        ]
      }
    });

    if (block) {
      return res.status(403).json({ error: 'Cannot create conversation. User is blocked.' });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        participants: { every: { userId: { in: [userId, targetUserId] } } },
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, profileImage: true, profileType: true }
            }
          }
        }
      }
    });

    if (existing) return res.json(existing);

    // Create new
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId },
            { userId: targetUserId }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, profileImage: true, profileType: true }
            }
          }
        }
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};
