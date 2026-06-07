const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '101742633395-rmm6bpid906m1df01oh5p3ve4ek09m9s.apps.googleusercontent.com');

exports.googleLogin = async (req, res) => {
  try {
    const { credential, username } = req.body;
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists (by googleId or email)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    });

    if (user) {
      // If user exists but doesn't have googleId linked, link it now
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, profileImage: user.profileImage === 'https://via.placeholder.com/150' ? picture : undefined }
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, profileType: user.profileType },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          profileType: user.profileType,
          profileImage: user.profileImage,
          bio: user.bio,
          location: user.location
        }
      });
    }

    // USER DOES NOT EXIST - NEW REGISTRATION
    // If frontend didn't provide a username yet, tell frontend to prompt for one
    if (!username) {
      return res.status(202).json({ 
        requireUsername: true, 
        message: 'Please choose a username to complete registration',
        suggestedName: name 
      });
    }

    // Frontend provided a username, create the account
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    user = await prisma.user.create({
      data: {
        username,
        email,
        googleId,
        displayName: name,
        profileImage: picture,
        profileType: 'CREATIVE',
      }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, profileType: user.profileType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profileType: user.profileType,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};

// Helper to generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, profileType, specializations } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        profileType: profileType || 'CREATIVE'
      }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, profileType: user.profileType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profileType: user.profileType,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, profileType: user.profileType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profileType: user.profileType,
        profileImage: user.profileImage,
        bio: user.bio,
        location: user.location,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        profileType: true,
        profileImage: true,
        bio: true,
        location: true,
        isVerified: true,
        isEmailVerified: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }
    
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      if (existingUser.username === username && existingUser.email === email) {
        return res.status(400).json({ error: 'Username and email are already taken' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }

    res.json({ available: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Availability check failed' });
  }
};
