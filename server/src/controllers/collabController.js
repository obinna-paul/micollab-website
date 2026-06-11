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

    // Recommendation strategy: Category match + Specialization match + Location match
    let collabs = await prisma.collab.findMany({
      where: { status: 'OPEN' },
      include: {
        poster: { select: { username: true, profileImage: true, profileType: true } },
        requirements: true,
        _count: { select: { proposals: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // score recent collabs
    });

    const userSkills = user.skills ? user.skills.split(',').map(s => s.trim()) : [];

    const scoredCollabs = collabs.map(collab => {
      let score = 0;
      
      // 1. Role match
      if (collab.category === user.profileType) score += 30;
      
      // 2. Specialization match
      const reqTags = collab.requirements.map(r => r.skill);
      const overlap = reqTags.filter(t => userSkills.includes(t)).length;
      score += overlap * 20;

      // 3. Location match
      if (user.location && collab.location && collab.location.includes(user.location)) {
        score += 15;
      }

      return { ...collab, _matchScore: score };
    });

    // Sort by highest score
    scoredCollabs.sort((a, b) => b._matchScore - a._matchScore);

    res.json(scoredCollabs.slice(0, 5));
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
            user: { select: { id: true, username: true, profileImage: true, profileType: true } },
            attachments: true
          }
        }
      }
    });
    if (!collab) return res.status(404).json({ error: 'Collab not found' });
    res.json(collab);
  } catch (error) {
    console.error('getCollabById Error:', error);
    res.status(500).json({ error: 'Failed to fetch collab details', details: error.message, stack: error.stack });
  }
};

exports.createCollab = async (req, res) => {
  try {
    const posterId = req.user.id;
    const { 
      title, description, budget, category, location, 
      projectType, deadline, experienceLevel, duration,
      requirements, attachments, crossPostToFeed, targetCircleId 
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
        targetCircleId: targetCircleId || null,
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
    const userId = req.user.id;
    const { collabId, coverLetter, portfolioLinks, attachments } = req.body;

    const existing = await prisma.proposal.findFirst({ where: { collabId, userId } });
    if (existing) return res.status(400).json({ error: 'You have already applied to this collab' });

    const collab = await prisma.collab.findUnique({ where: { id: collabId } });
    if (collab.posterId === userId) return res.status(400).json({ error: 'You cannot apply to your own collab' });

    const proposal = await prisma.proposal.create({
      data: { 
        collabId, 
        userId, 
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
      userId,
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
      // Find if conversation already exists between the two users
      const existingConvo = await prisma.conversation.findFirst({
        where: {
          participants: {
            every: {
              userId: { in: [proposal.collab.posterId, proposal.userId] }
            }
          }
        },
        include: { participants: true }
      });

      const hasBoth = existingConvo && existingConvo.participants.length === 2;

      if (!hasBoth) {
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId: proposal.collab.posterId },
                { userId: proposal.userId }
              ]
            }
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
      }
    }

    res.json(updated);

    // Notify applicant
    await notificationController.createNotification(
      proposal.userId,
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
      where: { userId },
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

exports.convertToCircle = async (req, res) => {
  try {
    const { id: collabId } = req.params;
    const { proposalId } = req.body;
    const userId = req.user.id;

    // Verify ownership and proposal
    const collab = await prisma.collab.findUnique({ where: { id: collabId } });
    if (!collab || collab.posterId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to convert this collab' });
    }

    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal || proposal.collabId !== collabId) {
      return res.status(400).json({ error: 'Invalid proposal' });
    }

    // Check if collab has a targetCircleId
    if (collab.targetCircleId) {
      // Fetch the existing circle
      const existingCircle = await prisma.circle.findUnique({
        where: { id: collab.targetCircleId }
      });

      if (!existingCircle || existingCircle.ownerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized or target circle not found' });
      }

      // Add user to the existing circle
      await prisma.circleMember.create({
        data: {
          circleId: collab.targetCircleId,
          userId: proposal.userId,
          role: 'CONTRIBUTOR'
        }
      });

      return res.status(200).json({ message: 'User added to existing circle', circle: existingCircle });
    }

    // Create the Circle
    const circle = await prisma.circle.create({
      data: {
        ownerId: userId,
        title: collab.title,
        description: collab.description,
        isPrivate: true,
        category: collab.category,
        collabId: collab.id,
        members: {
          create: [
            { userId: userId, role: 'OWNER' },
            { userId: proposal.userId, role: 'MEMBER' }
          ]
        }
      }
    });

    res.status(201).json({ message: 'Circle generated', circle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate Circle' });
  }
};
