const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const db = require('../models');
const { authenticateToken, authorize, requireRole } = require('../middleware/auth');
const { validate, uuidParam } = require('../middleware/validation');
const { Op } = require('sequelize');

// GET /api/users - List all users
router.get('/', authenticateToken, authorize('users:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (role) where.role = role;
    if (status !== undefined) where.isActive = status === 'active';

    const { rows: users, count } = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'refreshToken', 'twoFactorSecret', 'passwordResetToken'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticateToken, authorize('users:read'), uuidParam, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refreshToken', 'twoFactorSecret', 'passwordResetToken'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users - Create user (admin only)
router.post('/', authenticateToken, authorize('users:write'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['admin', 'member_manager', 'payment_manager', 'content_manager', 'event_manager', 'volunteer_manager', 'report_manager', 'member']),
  validate
], async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, language, phone } = req.body;

    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Cannot create super admin' });
    }

    const existing = await db.User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.User.create({
      email, password: hashedPassword, firstName, lastName, role,
      language: language || 'de', phone
    });

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      newValues: { email, firstName, lastName, role },
      ipAddress: req.ip
    });

    res.status(201).json({
      id: user.id, email: user.email, firstName: user.firstName,
      lastName: user.lastName, role: user.role
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticateToken, authorize('users:write'), uuidParam, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { firstName, lastName, role, language, phone, isActive } = req.body;
    const oldValues = { firstName: user.firstName, lastName: user.lastName, role: user.role, isActive: user.isActive };

    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Cannot assign super admin role' });
    }

    await user.update({ firstName, lastName, role, language, phone, isActive });

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      oldValues,
      newValues: { firstName, lastName, role, isActive },
      ipAddress: req.ip
    });

    res.json({ message: 'User updated', user: { id: user.id, email: user.email, firstName, lastName, role } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id (soft delete)
router.delete('/:id', authenticateToken, requireRole('super_admin'), uuidParam, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    await user.destroy();
    await db.AuditLog.create({
      userId: req.user.id,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: req.params.id,
      ipAddress: req.ip
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:id/reset-password (admin)
router.post('/:id/reset-password', authenticateToken, requireRole('super_admin', 'admin'), uuidParam, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tempPassword = 'Temp' + Math.random().toString(36).slice(2, 10) + '!1';
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    await user.update({ password: hashedPassword });

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip
    });

    res.json({ message: 'Password reset', temporaryPassword: tempPassword });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
