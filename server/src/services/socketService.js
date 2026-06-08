const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        const clientUrl = process.env.CLIENT_URL;
        if (clientUrl && origin.startsWith(clientUrl)) {
          return callback(null, true);
        }
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.match(/http:\/\/10\.\d+\.\d+\.\d+:\d+/)
        ) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join a private room for this user
    socket.join(socket.user.id);

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.user.username} joined conversation: ${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('typing_start', ({ conversationId }) => {
      socket.to(conversationId).emit('user_typing', { 
        userId: socket.user.id, 
        username: socket.user.username,
        conversationId 
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(conversationId).emit('user_stopped_typing', { 
        userId: socket.user.id, 
        conversationId 
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const isUserOnline = async (userId) => {
  if (!io) return false;
  const sockets = await io.in(userId).fetchSockets();
  return sockets.length > 0;
};

module.exports = { initSocket, getIO, isUserOnline };
