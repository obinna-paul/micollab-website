const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const notificationController = require('./notificationController');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Initialize an Escrow Deposit (when Poster accepts a proposal)
exports.initializeDeposit = async (req, res) => {
  try {
    const { proposalId } = req.body;
    const posterId = req.user.id;

    if (!PAYSTACK_SECRET) {
      // Mock flow if Paystack is not configured yet
      return res.status(200).json({ mock: true, message: 'Paystack not configured. Setup mock flow.' });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { collab: true, user: true }
    });

    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.collab.posterId !== posterId) return res.status(403).json({ error: 'Unauthorized' });

    const amountInKobo = Math.round(parseFloat(proposal.bidAmount) * 100);

    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: req.user.email,
        amount: amountInKobo,
        metadata: {
          type: 'ESCROW_DEPOSIT',
          proposalId,
          posterId,
          creativeId: proposal.userId
        },
        callback_url: `${process.env.FRONTEND_URL}/collabs/${proposal.collabId}?payment=success`
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ authorization_url: paystackRes.data.data.authorization_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to initialize Paystack deposit' });
  }
};

// Verify Paystack Webhook/Callback
exports.verifyDeposit = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!PAYSTACK_SECRET) {
      // Mock verification
      const { proposalId } = req.body;
      const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
      
      // Complete mock escrow
      await completeEscrowDeposit(proposalId, proposal.userId, parseFloat(proposal.bidAmount), `MOCK_${Date.now()}`);
      return res.json({ success: true, message: 'Mock deposit successful' });
    }

    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    const data = paystackRes.data.data;
    if (data.status === 'success' && data.metadata?.type === 'ESCROW_DEPOSIT') {
      const { proposalId, creativeId } = data.metadata;
      const amount = data.amount / 100;
      
      await completeEscrowDeposit(proposalId, creativeId, amount, reference);
      res.json({ success: true, message: 'Deposit verified and escrowed' });
    } else {
      res.status(400).json({ error: 'Payment not successful' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

async function completeEscrowDeposit(proposalId, creativeId, amount, reference) {
  // Check if already processed
  const existing = await prisma.transaction.findUnique({ where: { reference } });
  if (existing) return;

  // 1. Update Proposal status
  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: 'ACCEPTED', escrowStatus: 'HELD' }
  });

  // 2. Add to Creative's Escrow Balance
  let wallet = await prisma.wallet.findUnique({ where: { userId: creativeId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: creativeId, escrowBalance: amount } });
  } else {
    wallet = await prisma.wallet.update({
      where: { userId: creativeId },
      data: { escrowBalance: { increment: amount } }
    });
  }

  // 3. Create Transaction record
  await prisma.transaction.create({
    data: {
      userId: creativeId,
      amount,
      type: 'ESCROW_HOLD',
      reference,
      relatedEntityId: proposalId,
      description: `Funds held in escrow for proposal ${proposalId}`
    }
  });

  // Notify creative
  await notificationController.createNotification(
    creativeId,
    null,
    'PAYMENT',
    `A client has deposited ${amount} into Escrow for your proposal.`,
    proposalId
  );
}

// Release Escrow
exports.releaseEscrow = async (req, res) => {
  try {
    const { proposalId } = req.body;
    const posterId = req.user.id;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { collab: true }
    });

    if (!proposal || proposal.collab.posterId !== posterId) return res.status(403).json({ error: 'Unauthorized' });
    if (proposal.escrowStatus !== 'HELD') return res.status(400).json({ error: 'Funds are not currently held' });

    const amount = parseFloat(proposal.bidAmount);

    // Update Proposal
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { escrowStatus: 'RELEASED' }
    });

    // Move from Escrow to Available Balance
    await prisma.wallet.update({
      where: { userId: proposal.userId },
      data: {
        escrowBalance: { decrement: amount },
        availableBalance: { increment: amount }
      }
    });

    // Create Transaction
    await prisma.transaction.create({
      data: {
        userId: proposal.userId,
        amount,
        type: 'ESCROW_RELEASE',
        relatedEntityId: proposalId,
        description: `Funds released from escrow for proposal ${proposalId}`
      }
    });

    // Notify creative
    await notificationController.createNotification(
      proposal.userId,
      posterId,
      'PAYMENT',
      `Your escrowed funds of ${amount} have been released to your available balance!`,
      proposalId
    );

    res.json({ success: true, message: 'Funds released successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to release funds' });
  }
};

// Open Escrow Dispute
exports.openDispute = async (req, res) => {
  try {
    const { proposalId, reason } = req.body;
    const userId = req.user.id;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { collab: true }
    });

    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.collab.posterId !== userId && proposal.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (proposal.escrowStatus !== 'HELD') {
      return res.status(400).json({ error: 'Only active escrows can be disputed' });
    }

    await prisma.proposal.update({
      where: { id: proposalId },
      data: { escrowStatus: 'DISPUTED' }
    });

    // Notify admins (simplified) and the other party
    const otherUserId = userId === proposal.userId ? proposal.collab.posterId : proposal.userId;
    await notificationController.createNotification(
      otherUserId,
      userId,
      'ALERT',
      `A dispute has been opened for proposal ${proposalId}. Reason: ${reason}`,
      proposalId
    );

    res.json({ success: true, message: 'Dispute opened and admin notified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to open dispute' });
  }
};
