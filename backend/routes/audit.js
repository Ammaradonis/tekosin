const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken, authorize, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/', authenticateToken, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entity, userId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;
    if (startDate && endDate) where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };

    const { rows: logs, count } = await db.AuditLog.findAndCountAll({
      where,
      include: [{ model: db.User, attributes: ['firstName', 'lastName', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });
    res.json({ logs, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticateToken, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const totalLogs = await db.AuditLog.count();
    const todayLogs = await db.AuditLog.count({
      where: { createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } }
    });
    const byAction = await db.AuditLog.findAll({
      attributes: ['action', [db.sequelize.fn('COUNT', '*'), 'count']],
      group: ['action'], order: [[db.sequelize.fn('COUNT', '*'), 'DESC']], limit: 20
    });
    const byEntity = await db.AuditLog.findAll({
      attributes: ['entity', [db.sequelize.fn('COUNT', '*'), 'count']],
      group: ['entity'], order: [[db.sequelize.fn('COUNT', '*'), 'DESC']]
    });
    res.json({ totalLogs, todayLogs, byAction, byEntity });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
