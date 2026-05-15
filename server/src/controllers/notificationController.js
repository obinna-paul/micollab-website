const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: {
        triggeredBy: {
          select: {
            username: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: req.user.id,
        id: req.params.id
      },
      data: { isRead: true }
    });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await prisma.notification.delete({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Helper for internal use to create notifications
exports.createNotification = async (userId, triggeredById, type, content, relatedId) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        triggeredById,
        type,
        content,
        relatedId
      }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
