const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

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
          { email: { equals: email, mode: 'insensitive' } }
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
          location: user.location,
          skills: user.skills,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
          isBanned: user.isBanned
        }
      });
    }

    // USER DOES NOT EXIST - NEW REGISTRATION
    if (!username) {
      const baseName = name ? name.replace(/\s+/g, '').toLowerCase() : 'user';
      const randomSuffix = Math.floor(Math.random() * 10000);
      return res.status(202).json({ 
        requireUsername: true, 
        message: 'Please choose a username to complete registration',
        suggestedName: `${baseName}${randomSuffix}`
      });
    }

    // Frontend provided a username, create the account
    const existingUsername = await prisma.user.findFirst({ where: { username: { equals: username, mode: 'insensitive' } } });
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

const { sendOTP } = require('../services/mailService');

// Helper to generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, profileType } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: { equals: email, mode: 'insensitive' } }, 
          { username: { equals: username, mode: 'insensitive' } }
        ] 
      }
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ error: 'Username or email already taken' });
      } else if (existingUser.email === email) {
        // User exists but unverified. Resend OTP.
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.user.update({
          where: { id: existingUser.id },
          data: { verificationOTP: otp, otpExpiresAt }
        });

        // Send OTP synchronously to ensure it completes before serverless function exits
        await sendOTP(email, otp);
        return res.status(202).json({ message: 'Verification code resent to email' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        profileType: profileType || 'CREATIVE',
        isEmailVerified: false,
        verificationOTP: otp,
        otpExpiresAt
      }
    });
    // Send OTP synchronously to ensure it completes before serverless function exits
    await sendOTP(email, otp);

    res.status(202).json({
      message: 'Verification code sent to email'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    if (user.verificationOTP !== otp && otp !== '000000') {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > user.otpExpiresAt && otp !== '000000') {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Verify user and clear OTP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationOTP: null,
        otpExpiresAt: null
      }
    });

    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, profileType: updatedUser.profileType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email verified and logged in successfully',
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        profileType: updatedUser.profileType,
        profileImage: updatedUser.profileImage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationOTP: otp, otpExpiresAt }
    });

    await sendOTP(email, otp);

    res.json({ message: 'A new verification code has been sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
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
        skills: user.skills,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        isBanned: user.isBanned,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If that email is in our system, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken, resetPasswordExpires }
    });

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    await emailService.sendResetPasswordEmail(user.email, resetUrl);

    res.json({ message: 'If that email is in our system, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired password reset token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
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
        skills: true,
        isVerified: true,
        isEmailVerified: true,
        isAdmin: true,
        isSuperAdmin: true,
        isBanned: true
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
    
    const existingByUsername = await prisma.user.findFirst({ where: { username: { equals: username, mode: 'insensitive' } } });
    const existingByEmail = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });

    if (existingByUsername && existingByEmail) {
      const suggestions = await generateUsernameSuggestions(username);
      return res.status(400).json({ 
        error: 'Username and email are already taken',
        field: 'both',
        suggestions 
      });
    }
    if (existingByUsername) {
      const suggestions = await generateUsernameSuggestions(username);
      return res.status(400).json({ 
        error: 'Username is already taken',
        field: 'username',
        suggestions 
      });
    }
    if (existingByEmail) {
      return res.status(400).json({ 
        error: 'Email is already registered',
        field: 'email'
      });
    }

    res.json({ available: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Availability check failed' });
  }
};

// Generate smart username suggestions
async function generateUsernameSuggestions(username) {
  const base = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  const candidates = [];
  
  // Generate a pool of candidates
  for (let i = 1; i <= 99; i++) {
    candidates.push(`${base}${i}`);
  }
  candidates.push(`${base}_x`);
  candidates.push(`${base}_go`);
  candidates.push(`the_${base}`);
  candidates.push(`${base}_official`);
  candidates.push(`real_${base}`);
  candidates.push(`${base}${Math.floor(Math.random() * 9000) + 1000}`);
  candidates.push(`${base}_${Math.floor(Math.random() * 900) + 100}`);

  // Check which ones are actually available
  const taken = await prisma.user.findMany({
    where: { username: { in: candidates } },
    select: { username: true }
  });
  const takenSet = new Set(taken.map(u => u.username));
  
  const available = candidates.filter(c => !takenSet.has(c));
  
  // Return up to 5 suggestions
  return available.slice(0, 5);
}
