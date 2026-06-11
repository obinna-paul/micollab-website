const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getPosts = async (req, res) => {
  try {
    let posts = await prisma.post.findMany({
      where: { isArchived: false },
      include: {
        creator: {
          select: { id: true, username: true, profileImage: true, profileType: true, isVerified: true }
        },
        originalPost: {
          include: {
            creator: { select: { id: true, username: true, profileImage: true, profileType: true, isVerified: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (req.user) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { profileType: true, skills: true, connectedTo: { select: { id: true } } }
      });
      
      if (user) {
        const userSkills = user.skills ? user.skills.split(',').map(s => s.trim()) : [];
        const networkIds = user.connectedTo.map(c => c.id);

        posts = posts.map(post => {
          let score = 0;
          const postTags = post.tags ? post.tags.split(',').map(t => t.trim()) : [];
          
          // Match by tags / specializations
          const hasOverlappingTag = postTags.some(t => userSkills.includes(t));
          if (hasOverlappingTag) score += 50;
          
          // Match by Primary Role
          if (post.creator.profileType === user.profileType) score += 30;
          
          // Network boost
          if (networkIds.includes(post.creator.id)) score += 40;

          return { ...post, _matchScore: score };
        });

        // Sort by match score descending, then by creation date
        posts.sort((a, b) => {
          if (b._matchScore !== a._matchScore) {
            return b._matchScore - a._matchScore;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      }
    }

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            username: true,
            profileImage: true,
            profileType: true,
            bio: true
          }
        },
        originalPost: {
          include: {
            creator: {
              select: {
                username: true,
                profileImage: true,
                profileType: true,
                isVerified: true
              }
            }
          }
        }
      }
    });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { caption, mediaUrl, contentType, postCategory } = req.body;
    const creatorId = req.user.id;

    const validCategories = ['UPDATE', 'MEDIA', 'EVENT'];
    const category = validCategories.includes(postCategory) ? postCategory : 'UPDATE';

    const post = await prisma.post.create({
      data: {
        caption,
        mediaUrl: mediaUrl || null,
        contentType: contentType || 'TEXT',
        postCategory: category,
        creatorId
      },
      include: {
        creator: {
          select: {
            username: true,
            profileImage: true,
            profileType: true,
            isVerified: true
          }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

exports.repost = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;

    const originalPost = await prisma.post.findUnique({ where: { id } });
    if (!originalPost) return res.status(404).json({ error: 'Post not found' });

    const repost = await prisma.post.create({
      data: {
        postCategory: 'REPOST',
        creatorId,
        originalPostId: id,
        caption: `Reposted from @${originalPost.creatorId}`, // Optional placeholder or logic
        contentType: 'TEXT'
      },
      include: {
        creator: {
          select: { username: true, profileImage: true, profileType: true, isVerified: true }
        },
        originalPost: {
          include: {
            creator: { select: { username: true, profileImage: true, profileType: true, isVerified: true } }
          }
        }
      }
    });

    res.status(201).json(repost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to repost' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { postId: id },
      include: {
        user: {
          select: { username: true, profileImage: true, profileType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) return res.status(400).json({ error: 'Comment content is required' });

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: id,
        userId
      },
      include: {
        user: {
          select: { username: true, profileImage: true, profileType: true }
        }
      }
    });

    // Increment comment count on post
    await prisma.post.update({
      where: { id },
      data: { commentsCount: { increment: 1 } }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption } = req.body;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.creatorId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { 
        caption,
        isEdited: true
      },
      include: {
        creator: {
          select: { username: true, profileImage: true, profileType: true, isVerified: true }
        }
      }
    });

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

exports.archivePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await prisma.post.update({
      where: { id, creatorId: userId },
      data: { isArchived: true }
    });
    res.json({ message: 'Post archived' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await prisma.post.delete({
      where: { id, creatorId: userId }
    });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
};
