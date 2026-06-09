const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  console.error('Incoming Auth Header:', req.headers.authorization);
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is not banned
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, isBanned: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists. Please log in again.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended for violating our terms of service.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
