const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const apiRoutes = require('./routes/api');

const { createServer } = require('http');
const { initSocket } = require('./services/socketService');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Initialize Socket.io
initSocket(httpServer);

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow frontend Vercel deployment URL
    const clientUrl = process.env.CLIENT_URL;
    if (clientUrl && origin.startsWith(clientUrl)) {
      return callback(null, true);
    }
    // Allow localhost and any local network IP
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.match(/http:\/\/10\.\d+\.\d+\.\d+:\d+/)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));
app.use(express.json());

const path = require('path');

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Temporary DB cleanup for user micollab
    const user = await prisma.user.findFirst({ where: { username: 'micollab' } });
    if (user) {
      await prisma.portfolioItem.deleteMany({ where: { userId: user.id } });
      await prisma.testimonial.deleteMany({ where: { OR: [{ toUserId: user.id }, { fromUserId: user.id }] } });
      await prisma.post.deleteMany({ where: { creatorId: user.id } });
      console.log("Deleted mock portfolio items, testimonials, and posts for micollab");
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://10.59.144.84:${PORT}`);
    });
  } catch (error) {
    console.error("Error during startup cleanup:", error);
  }
})();
