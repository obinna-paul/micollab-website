const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isUserOnline } = require('../services/socketService');
const { sendNotificationEmail } = require('../utils/emailService');

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

    const inviteIds = notifications
      .filter(n => n.type === 'CIRCLE_INVITE' && n.relatedId)
      .map(n => n.relatedId);

    const invitations = await prisma.circleInvitation.findMany({
      where: { id: { in: inviteIds } },
      select: { id: true, circleId: true }
    });

    const inviteMap = invitations.reduce((acc, inv) => {
      acc[inv.id] = inv.circleId;
      return acc;
    }, {});

    const notificationsWithLinks = notifications.map(n => {
      let link = null;
      if (n.type === 'CIRCLE_INVITE') {
        const circleId = inviteMap[n.relatedId];
        if (circleId) {
          link = `/circles/${circleId}`;
        }
      } else if (n.type === 'CIRCLE_JOINED' || n.type === 'CIRCLE_REJECTED') {
        link = `/circles/${n.relatedId}`;
      } else if (n.type === 'CONNECTION') {
        link = '/network';
      } else if (n.type === 'PROPOSAL_RECEIVED' || n.type === 'PROPOSAL_STATUS_CHANGED') {
        link = '/collabs';
      }
      
      return {
        ...n,
        link
      };
    });

    res.json(notificationsWithLinks);
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
    const notification = await prisma.notification.create({
      data: {
        userId,
        triggeredById,
        type,
        content,
        relatedId
      }
    });

    // Send offline email if user is not connected
    const isOnline = await isUserOnline(userId);
    if (!isOnline) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      if (targetUser && targetUser.email) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        
        let title = 'New Notification';
        let link = `${clientUrl}/notifications`;
        
        if (type === 'CONNECTION_REQUEST') {
          title = 'New Connection Request';
          link = `${clientUrl}/network`;
        } else if (type === 'PROPOSAL_RECEIVED' || type === 'PROPOSAL_STATUS_CHANGED') {
          title = 'Update on Collab Proposal';
          link = `${clientUrl}/collabs`;
        } else if (type === 'CIRCLE_INVITE') {
          title = 'New Circle Invitation';
          link = `${clientUrl}/circles`;
        }
        
        sendNotificationEmail(targetUser.email, title, content, link);
      }
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
