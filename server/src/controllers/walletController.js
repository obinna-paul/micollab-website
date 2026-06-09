const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get Wallet Balance
exports.getWallet = async (req, res) => {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: req.user.id }
      });
    }

    res.json(wallet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
};

// Get Transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Request Withdrawal
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, payoutMethod, payoutDetails } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!payoutMethod || !payoutDetails) return res.status(400).json({ error: 'Missing payout details' });

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.availableBalance < amount) {
      return res.status(400).json({ error: 'Insufficient available balance' });
    }

    // Deduct from wallet
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: { availableBalance: { decrement: amount } }
    });

    // Create withdrawal request
    const request = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount,
        payoutMethod,
        payoutDetails: JSON.stringify(payoutDetails)
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        amount,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        description: `Withdrawal request to ${payoutMethod}`
      }
    });

    res.json({ message: 'Withdrawal requested successfully', wallet: updatedWallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to request withdrawal' });
  }
};
