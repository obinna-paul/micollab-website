const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationController = require('./notificationController');

// Get all pending withdrawals
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { username: true, email: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(withdrawals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
};

// Mark a withdrawal as paid
exports.processWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    if (withdrawal.status !== 'PENDING') return res.status(400).json({ error: 'Already processed' });

    await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'PROCESSED', adminNotes: notes }
    });

    // Notify user
    await notificationController.createNotification(
      withdrawal.userId,
      null,
      'PAYMENT',
      `Your withdrawal request for ${withdrawal.amount} ${withdrawal.currency} has been processed!`,
      id
    );

    res.json({ success: true, message: 'Withdrawal marked as processed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
};

// Reject a withdrawal
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    if (withdrawal.status !== 'PENDING') return res.status(400).json({ error: 'Already processed' });

    // Mark as rejected
    await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'REJECTED', adminNotes: notes }
    });

    // Refund available balance
    await prisma.wallet.update({
      where: { userId: withdrawal.userId },
      data: { availableBalance: { increment: withdrawal.amount } }
    });

    // Notify user
    await notificationController.createNotification(
      withdrawal.userId,
      null,
      'PAYMENT',
      `Your withdrawal request for ${withdrawal.amount} ${withdrawal.currency} was rejected. Funds returned to balance. Reason: ${notes}`,
      id
    );

    res.json({ success: true, message: 'Withdrawal rejected and refunded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
};

// Admin Dashboard Metrics
exports.getMetrics = async (req, res) => {
    try {
      const totalUsers = await prisma.user.count();
      const activeCollabs = await prisma.collab.count({ where: { status: 'OPEN' } });
      const wallets = await prisma.wallet.findMany({ select: { escrowBalance: true, availableBalance: true } });
      
      const totalEscrow = wallets.reduce((acc, curr) => acc + curr.escrowBalance, 0);
      const totalAvailable = wallets.reduce((acc, curr) => acc + curr.availableBalance, 0);
      
      // Calculate DAU (Active in last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dau = await prisma.user.count({ where: { lastActive: { gte: oneDayAgo } } });

      // Calculate MAU (Active in last 30d)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const mau = await prisma.user.count({ where: { lastActive: { gte: thirtyDaysAgo } } });

      // Calculate Active Now (Active in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activeNow = await prisma.user.count({ where: { lastActive: { gte: fiveMinutesAgo } } });

      // Sum of Total Time Spent
      const timeSpentAgg = await prisma.user.aggregate({
        _sum: { totalTimeSpent: true }
      });
      const totalTimeSpentSeconds = timeSpentAgg._sum.totalTimeSpent || 0;

      res.json({ 
        totalUsers, activeCollabs, totalEscrow, totalAvailable,
        dau, mau, activeNow, totalTimeSpentSeconds
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  };

// Get All Users
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, email: true, profileImage: true, 
        isAdmin: true, isBanned: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Toggle Admin Status
exports.toggleAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    
    // Prevent removing your own admin rights if you are the last admin? (Just basic toggle for now)
    const updated = await prisma.user.update({
      where: { id },
      data: { isAdmin: !user.isAdmin }
    });
    
    res.json({ success: true, isAdmin: updated.isAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle admin status' });
  }
};

// Toggle Ban Status
exports.toggleBan = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    
    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: !user.isBanned }
    });
    
    res.json({ success: true, isBanned: updated.isBanned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle ban status' });
  }
};

// Resolve Escrow Dispute
exports.resolveDispute = async (req, res) => {
  try {
    const { proposalId, action, reason } = req.body; // action: 'REFUND_POSTER' or 'PAY_CREATIVE'
    
    const proposal = await prisma.proposal.findUnique({ 
      where: { id: proposalId },
      include: { collab: true }
    });
    
    if (!proposal || proposal.escrowStatus !== 'DISPUTED') {
      return res.status(400).json({ error: 'Proposal is not disputed' });
    }

    const amount = parseFloat(proposal.bidAmount);

    let disputeStatus = 'RESOLVED';

    if (action === 'PAY_CREATIVE') {
      disputeStatus = 'RESOLVED_CREATIVE';
      // Give to creative
      await prisma.proposal.update({ where: { id: proposalId }, data: { escrowStatus: 'RELEASED' } });
      await prisma.wallet.update({
        where: { userId: proposal.userId },
        data: { escrowBalance: { decrement: amount }, availableBalance: { increment: amount } }
      });
      // Notify creative
      await notificationController.createNotification(
        proposal.userId, null, 'PAYMENT',
        `Admin resolved a dispute in your favor. ${amount} has been added to your available balance.`,
        proposalId
      );
    } else if (action === 'REFUND_POSTER') {
      disputeStatus = 'RESOLVED_POSTER';
      // Refund to Poster
      await prisma.proposal.update({ where: { id: proposalId }, data: { escrowStatus: 'REFUNDED' } });
      await prisma.wallet.update({
        where: { userId: proposal.userId },
        data: { escrowBalance: { decrement: amount } }
      });
      
      let posterWallet = await prisma.wallet.findUnique({ where: { userId: proposal.collab.posterId } });
      if (!posterWallet) {
        posterWallet = await prisma.wallet.create({ data: { userId: proposal.collab.posterId, availableBalance: amount } });
      } else {
        await prisma.wallet.update({ where: { userId: proposal.collab.posterId }, data: { availableBalance: { increment: amount } } });
      }
      
      // Notify Poster
      await notificationController.createNotification(
        proposal.collab.posterId, null, 'PAYMENT',
        `Admin resolved a dispute in your favor. ${amount} has been refunded to your wallet.`,
        proposalId
      );
    }

    // Update the dispute model status
    await prisma.dispute.updateMany({
      where: { proposalId: proposalId },
      data: { status: disputeStatus, adminNotes: reason }
    });

    res.json({ success: true, message: 'Dispute resolved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
};

// Get All Disputes
exports.getDisputes = async (req, res) => {
    try {
      const disputes = await prisma.dispute.findMany({
        where: { status: 'OPEN' },
        include: { 
          proposal: {
            include: {
              collab: { select: { title: true, poster: { select: { username: true } } } },
              user: { select: { username: true } }
            }
          },
          openedBy: { select: { username: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
      res.json(disputes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch disputes' });
    }
  };
