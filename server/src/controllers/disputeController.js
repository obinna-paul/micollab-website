const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationController = require('./notificationController');

// Get all disputes involving the current user
exports.getMyDisputes = async (req, res) => {
  try {
    const userId = req.user.id;
    const disputes = await prisma.dispute.findMany({
      where: {
        proposal: {
          OR: [
            { userId: userId },
            { collab: { posterId: userId } }
          ]
        }
      },
      include: {
        proposal: {
          include: { collab: { select: { title: true } } }
        },
        openedBy: { select: { username: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(disputes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your disputes' });
  }
};

// Get single dispute with messages
exports.getDisputeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin || req.user.isSuperAdmin;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        proposal: {
          include: { 
            collab: { select: { title: true, posterId: true, poster: { select: { username: true, profileImage: true } } } },
            user: { select: { username: true, profileImage: true } } // Creative
          }
        },
        openedBy: { select: { username: true, profileImage: true } },
        messages: {
          include: { sender: { select: { username: true, profileImage: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    // Access control: only involved parties or admins
    if (!isAdmin && dispute.proposal.userId !== userId && dispute.proposal.collab.posterId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this dispute' });
    }

    res.json(dispute);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dispute details' });
  }
};

// Post a message to the dispute room
exports.addDisputeMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin || req.user.isSuperAdmin;

    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        proposal: { include: { collab: true } }
      }
    });

    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    // Access control
    if (!isAdmin && dispute.proposal.userId !== userId && dispute.proposal.collab.posterId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to post in this dispute' });
    }

    if (dispute.status !== 'OPEN') {
      return res.status(400).json({ error: 'Cannot send messages to a resolved dispute' });
    }

    const newMessage = await prisma.disputeMessage.create({
      data: {
        disputeId: id,
        senderId: userId,
        message,
        isAdmin: isAdmin
      },
      include: { sender: { select: { username: true, profileImage: true } } }
    });

    await prisma.dispute.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Notify other parties (simplified logic)
    const parties = [dispute.proposal.userId, dispute.proposal.collab.posterId];
    if (isAdmin) parties.push(userId); // admin is part of it if they reply

    parties.forEach(async (partyId) => {
      if (partyId !== userId) {
        await notificationController.createNotification(
          partyId,
          userId,
          'ALERT',
          `New message in dispute for "${dispute.proposal.collab.title}"`,
          dispute.proposalId // maybe link them directly to dispute room later
        );
      }
    });

    res.json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add message' });
  }
};
