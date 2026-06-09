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
