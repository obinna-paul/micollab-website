const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Process an escrow deposit
exports.deposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { collabId, proposalId, amount, milestoneId } = req.body;

    // Simulate payment gateway processing (Paystack)
    // In production, we'd initialize a Paystack transaction here and return an authorization URL

    const parsedAmount = parseFloat(amount.replace(/[^0-9.-]+/g, "")) || 0;

    // Create a transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parsedAmount,
        currency: 'NGN', // Base currency fallback for now
        type: 'ESCROW_HOLD',
        status: 'COMPLETED',
        description: `Escrow deposit for project/milestone`,
        relatedEntityId: milestoneId || proposalId
      }
    });

    if (milestoneId) {
      // Update milestone status
      await prisma.circleMilestone.update({
        where: { id: milestoneId },
        data: { payoutStatus: 'FUNDED', payoutAmount: parsedAmount }
      });
    } else if (proposalId) {
      // Simple collab - update proposal escrow status
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { escrowStatus: 'HELD' }
      });
    }

    res.json({ message: 'Deposit successful', transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process escrow deposit' });
  }
};

// Release escrow funds to creative
exports.release = async (req, res) => {
  try {
    const userId = req.user.id; // Usually the client or Circle Owner
    const { collabId, proposalId, milestoneId } = req.body;

    let releaseAmount = 0;
    let targetUserId = null;

    if (milestoneId) {
      // In a real app we would check if the milestone belongs to a circle and who is assigned to it.
      // Since CircleMilestone doesn't have an assignee in the schema, we would either pay the whole circle 
      // or we need an assignee. For now, we'll assume the milestone is tied to a specific creative if we implement assignees.
      const milestone = await prisma.circleMilestone.findUnique({ where: { id: milestoneId } });
      if (milestone.payoutStatus !== 'FUNDED') return res.status(400).json({ error: 'Milestone is not funded' });
      releaseAmount = milestone.payoutAmount;
      // Note: If no assignee exists, we'd need to handle this. For this MVP, we focus on the proposal workflow.
    } else {
      const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
      if (proposal.escrowStatus !== 'HELD') return res.status(400).json({ error: 'Proposal is not funded' });
      const bid = parseFloat(proposal.bidAmount?.replace(/[^0-9.-]+/g, "") || "0") || 0;
      releaseAmount = bid;
      targetUserId = proposal.userId;
    }

    if (!targetUserId && !milestoneId) {
       return res.status(400).json({ error: 'Target user could not be determined' });
    }

    // Deduct 5% platform fee
    const feeAmount = releaseAmount * 0.05;
    const netAmount = releaseAmount - feeAmount;

    // Create Escrow Release Transaction
    await prisma.transaction.create({
      data: {
        userId: targetUserId,
        amount: releaseAmount,
        feeAmount: feeAmount,
        netAmount: netAmount,
        currency: 'NGN',
        type: 'ESCROW_RELEASE',
        status: 'COMPLETED',
        description: `Escrow release for completed work`,
        relatedEntityId: milestoneId || proposalId
      }
    });

    // Update the Wallet of the Creative
    // (Assuming Wallet model exists, or we track balance via Transactions)
    // For now, we update the status on the entity

    if (milestoneId) {
      await prisma.circleMilestone.update({
        where: { id: milestoneId },
        data: { payoutStatus: 'RELEASED' }
      });
    } else {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { escrowStatus: 'RELEASED' }
      });
    }

    res.json({ message: 'Funds released successfully', netAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to release funds' });
  }
};
