const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.sendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send a message request to yourself' });
    }

    // Check if an existing request or accepted connection exists
    const existingReq = await prisma.messageRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });

    if (existingReq) {
      if (existingReq.status === 'ACCEPTED') {
         return res.status(400).json({ error: 'You already have an active conversation with this user.' });
      }
      return res.status(400).json({ error: 'A request already exists between you and this user.' });
    }

    const request = await prisma.messageRequest.create({
      data: {
        senderId,
        receiverId,
        message
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message request' });
  }
};

exports.getIncomingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await prisma.messageRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: { id: true, username: true, profileImage: true, profileType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message requests' });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const { status } = req.body; // 'ACCEPTED' or 'REJECTED'

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await prisma.messageRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== userId) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updated = await prisma.messageRequest.update({
      where: { id: requestId },
      data: { status }
    });

    // If accepted, we might want to automatically create the first Message in the chat
    if (status === 'ACCEPTED') {
      await prisma.message.create({
        data: {
          senderId: request.senderId,
          receiverId: request.receiverId,
          content: request.message
        }
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to respond to request' });
  }
};
