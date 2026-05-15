const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationController = require('./notificationController');

// GET /api/collabs - All collabs with advanced filtering
exports.getCollabs = async (req, res) => {
  try {
    const { 
      category, search, budgetRange, locationType, 
      experienceLevel, projectType, verifiedOnly 
    } = req.query;

    const whereClause = {
      status: 'OPEN',
      ...(category && { category }),
      ...(experienceLevel && { experienceLevel }),
      ...(projectType && { projectType }),
      ...(verifiedOnly === 'true' && { isVerified: true }),
    };

    // Location filtering
    if (locationType === 'REMOTE') {
      whereClause.location = 'Remote';
    } else if (locationType === 'IN_PERSON') {
      whereClause.NOT = { location: 'Remote' };
    }

    // Search logic
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Budget filtering (Basic range logic)
    if (budgetRange && budgetRange !== 'ALL') {
       // Note: budget is currently a string in DB, usually with Naira symbol.
       // In a real prod env, we'd use numeric fields for filtering.
       // For now, we'll filter by category match or range if possible.
    }

    const collabs = await prisma.collab.findMany({
      where: whereClause,
      include: {
        poster: { select: { username: true, profileImage: true, profileType: true, isVerified: true } },
        requirements: true,
        _count: { select: { proposals: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(collabs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch collabs' });
  }
};

// GET /api/collabs/recommended - Personalized opportunities
exports.getRecommendedCollabs = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Recommendation strategy: Category match + Location match
    const collabs = await prisma.collab.findMany({
      where: {
        status: 'OPEN',
        OR: [
          { category: user.profileType === 'CREATIVE' ? user.skills?.split(',')[0] : undefined },
          { location: { contains: user.location || '' } }
        ]
      },
      include: {
        poster: { select: { username: true, profileImage: true, profileType: true } },
        _count: { select: { proposals: true } }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    res.json(collabs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};

exports.getCollabById = async (req, res) => {
  try {
    const { id } = req.params;
    const collab = await prisma.collab.findUnique({
      where: { id },
      include: {
        poster: { select: { id: true, username: true, profileImage: true, profileType: true, bio: true, isVerified: true } },
        requirements: true,
        attachments: true,
        proposals: {
          include: {
            creator: { select: { id: true, username: true, profileImage: true, profileType: true } },
            attachments: true
          }
        }
      }
    });
    if (!collab) return res.status(404).json({ error: 'Collab not found' });
    res.json(collab);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch collab details' });
  }
};

exports.createCollab = async (req, res) => {
  try {
    const posterId = req.user.id;
    const { 
      title, description, budget, category, location, 
      projectType, deadline, experienceLevel, duration,
      requirements, attachments, crossPostToFeed 
    } = req.body;

    const collab = await prisma.collab.create({
      data: { 
        title, 
        description, 
        budget, 
        category, 
        location, 
        projectType: projectType || 'ONE_OFF',
        deadline: deadline ? new Date(deadline) : null,
        experienceLevel,
        duration,
        posterId, 
        crossPostToFeed: crossPostToFeed || false,
        requirements: {
          create: requirements?.map(skill => ({ skill }))
        },
        attachments: {
          create: attachments?.map(att => ({ fileUrl: att.url, fileType: att.type }))
        }
      }
    });

    if (crossPostToFeed) {
      await prisma.post.create({
        data: {
          creatorId: posterId,
          contentType: 'TEXT',
          postCategory: 'UPDATE',
          isCollabCard: true,
          collabId: collab.id,
          caption: `🤝 posted a new collab opportunity: "${title}"`
        }
      });
    }

    res.status(201).json(collab);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create collab' });
  }
};

exports.submitProposal = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { collabId, coverLetter, portfolioLinks, attachments } = req.body;

    const existing = await prisma.proposal.findFirst({ where: { collabId, creatorId } });
    if (existing) return res.status(400).json({ error: 'You have already applied to this collab' });

    const collab = await prisma.collab.findUnique({ where: { id: collabId } });
    if (collab.posterId === creatorId) return res.status(400).json({ error: 'You cannot apply to your own collab' });

    const proposal = await prisma.proposal.create({
      data: { 
        collabId, 
        creatorId, 
        coverLetter, 
        portfolioLinks,
        attachments: {
          create: attachments?.map(att => ({ fileUrl: att.url, fileType: att.type }))
        }
      }
    });

    res.status(201).json(proposal);

    // Notify poster
    await notificationController.createNotification(
      collab.posterId,
      creatorId,
      'COLLAB_PROPOSAL',
      'New Project Proposal',
      `submitted a proposal for: ${collab.title}`,
      `/collabs/manage/${collab.id}`
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit proposal' });
  }
};

exports.updateProposalStatus = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Verify user is the poster of the collab
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { collab: true }
    });

    if (proposal.collab.posterId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status }
    });

    // messaging unlock: Create a conversation thread if shortlisted/accepted
    if (status === 'SHORTLISTED' || status === 'ACCEPTED') {
      const existingThread = await prisma.proposalThread.findFirst({
        where: { 
          collabId: proposal.collabId,
          creatorId: proposal.creatorId
        }
      });

      if (!existingThread) {
        const conversation = await prisma.conversation.create({
          data: {
            type: 'PROPOSAL',
            participants: {
              create: [
                { userId: proposal.collab.posterId },
                { userId: proposal.creatorId }
              ]
            }
          }
        });

        await prisma.proposalThread.create({
          data: {
            conversationId: conversation.id,
            collabId: proposal.collabId,
            creatorId: proposal.creatorId,
            scoutId: proposal.collab.posterId,
            status: status
          }
        });

        // Add an initial system message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: proposal.collab.posterId,
            content: `👋 I've reviewed your proposal for "${proposal.collab.title}" and would like to chat further!`
          }
        });
      } else {
         // Update existing thread status
         await prisma.proposalThread.update({
            where: { id: existingThread.id },
            data: { status }
         });
      }
    }

    res.json(updated);

    // Notify applicant
    await notificationController.createNotification(
      proposal.creatorId,
      userId,
      'COLLAB_PROPOSAL',
      'Proposal Status Update',
      `updated your proposal status to ${status} for: ${proposal.collab.title}`,
      '/collabs/my-proposals'
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

exports.getMyCollabs = async (req, res) => {
  try {
    const userId = req.user.id;
    const collabs = await prisma.collab.findMany({
      where: { posterId: userId },
      include: { _count: { select: { proposals: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(collabs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your collabs' });
  }
};

exports.getMyProposals = async (req, res) => {
  try {
    const userId = req.user.id;
    const proposals = await prisma.proposal.findMany({
      where: { creatorId: userId },
      include: {
        collab: {
          include: {
            poster: { select: { username: true, profileImage: true, profileType: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your proposals' });
  }
};
