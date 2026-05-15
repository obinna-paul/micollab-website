const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { isArchived: false },
      include: {
        creator: {
          select: {
            username: true,
            profileImage: true,
            profileType: true,
            isVerified: true
          }
        },
        _count: {
          select: { likes: true, comments: true }
        },
        collab: true
      },
      orderBy: { createdAt: 'desc' }
    });
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
        comments: {
          include: {
            user: {
              select: { username: true, profileImage: true }
            }
          }
        }
      }
    });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { 
      caption, mediaUrl, contentType, postCategory,
      eventDate, eventTime, eventLocation, inviteTarget
    } = req.body;
    const creatorId = req.user.id;

    // postCategory must be a feed type — collab posts go through the gigs endpoint
    const validCategories = ['UPDATE', 'MEDIA', 'EVENT'];
    const category = validCategories.includes(postCategory) ? postCategory : 'UPDATE';

    const postData = {
      caption,
      mediaUrl,
      contentType: contentType || 'TEXT',
      postCategory: category,
      creatorId
    };

    if (category === 'EVENT') {
      postData.eventDate = eventDate;
      postData.eventTime = eventTime;
      postData.eventLocation = eventLocation;
      postData.inviteTarget = inviteTarget || 'NONE';
    }

    const post = await prisma.post.create({
      data: postData,
      include: {
        creator: {
          select: {
            username: true,
            profileImage: true,
            profileType: true,
            isVerified: true
          }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create post' });
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
          select: {
            username: true,
            profileImage: true,
            profileType: true,
            isVerified: true
          }
        },
        _count: {
          select: { likes: true, comments: true }
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

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.creatorId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    await prisma.post.update({
      where: { id },
      data: { isArchived: true }
    });

    res.json({ message: 'Post archived successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to archive post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.creatorId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    await prisma.post.delete({ where: { id } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};
