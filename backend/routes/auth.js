const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
], async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return res.status(423).json({ error: 'Account locked. Try again later.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      await user.update({
        failedLoginAttempts: user.failedLoginAttempts + 1,
        lockedUntil: user.failedLoginAttempts >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : null
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const tokens = generateTokens(user);
    await user.update({
      lastLogin: new Date(),
      refreshToken: tokens.refreshToken,
      failedLoginAttempts: 0,
      lockedUntil: null
    });

    await db.AuditLog.create({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        language: user.language,
        avatar: user.avatar
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  validate
], async (req, res) => {
  try {
    const { email, password, firstName, lastName, language, phone } = req.body;

    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      language: language || 'de',
      phone,
      role: 'member',
      gdprConsent: true,
      gdprConsentDate: new Date()
    });

    const tokens = generateTokens(user);
    await user.update({ refreshToken: tokens.refreshToken });

    await db.AuditLog.create({
      userId: user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        language: user.language
      },
      ...tokens
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await db.User.findByPk(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);
    await user.update({ refreshToken: tokens.refreshToken });

    res.json(tokens);
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await req.user.update({ refreshToken: null });
    await db.AuditLog.create({
      userId: req.user.id,
      action: 'LOGOUT',
      entity: 'User',
      entityId: req.user.id,
      ipAddress: req.ip
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    language: user.language,
    avatar: user.avatar,
    phone: user.phone,
    isActive: user.isActive,
    gdprConsent: user.gdprConsent,
    lastLogin: user.lastLogin
  });
});

// PUT /api/auth/password
router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const isValid = await bcrypt.compare(currentPassword, req.user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await req.user.update({ password: hashedPassword });
    await db.AuditLog.create({
      userId: req.user.id,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: req.user.id,
      ipAddress: req.ip
    });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
