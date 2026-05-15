const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock Stripe setup
const stripe = {
  checkout: {
    sessions: {
      create: async () => ({ url: 'https://checkout.stripe.com/pay/mock_session' })
    }
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { creatorId, tier } = req.body;
    const fanId = req.user.id;

    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    // In a real app, you'd call stripe.checkout.sessions.create here
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${creator.username} - ${tier} Subscription` },
          unit_amount: tier === 'PRO' ? 1500 : 500,
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `http://localhost:5173/profile/${creator.username}?success=true`,
      cancel_url: `http://localhost:5173/profile/${creator.username}?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const creatorId = req.user.id;
    
    // Calculate total earnings from subscriptions (Mock logic)
    const subscriptions = await prisma.subscription.findMany({
      where: { creatorId }
    });

    const totalRevenue = subscriptions.length * 10; // Assume $10 average
    const activeSubscribers = subscriptions.length;

    res.json({
      totalRevenue,
      activeSubscribers,
      recentPayouts: [],
      pendingBalance: totalRevenue * 0.8 // Platform fee
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
};
