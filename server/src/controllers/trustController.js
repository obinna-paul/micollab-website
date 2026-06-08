const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const { userIdToBlock } = req.body;

    if (!userIdToBlock) {
      return res.status(400).json({ error: 'User ID to block is required' });
    }

    if (blockerId === userIdToBlock) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    // Check if block already exists
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId: userIdToBlock }
      }
    });

    if (existingBlock) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    await prisma.block.create({
      data: { blockerId, blockedId: userIdToBlock }
    });

    res.json({ message: 'User successfully blocked' });
  } catch (err) {
    console.error('Error blocking user:', err);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const { userIdToUnblock } = req.body;

    if (!userIdToUnblock) {
      return res.status(400).json({ error: 'User ID to unblock is required' });
    }

    await prisma.block.delete({
      where: {
        blockerId_blockedId: { blockerId, blockedId: userIdToUnblock }
      }
    });

    res.json({ message: 'User successfully unblocked' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Block not found' });
    }
    console.error('Error unblocking user:', err);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

// Report a user
exports.reportUser = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { reportedId, reason } = req.body;

    if (!reportedId || !reason) {
      return res.status(400).json({ error: 'Reported user ID and reason are required' });
    }

    if (reporterId === reportedId) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    await prisma.report.create({
      data: { reporterId, reportedId, reason }
    });

    res.json({ message: 'User successfully reported. Our team will review the interaction.' });
  } catch (err) {
    console.error('Error reporting user:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};
