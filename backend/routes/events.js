const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/', authenticateToken, authorize('events:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, upcoming } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (upcoming === 'true') where.startDate = { [Op.gte]: new Date() };

    const { rows: events, count } = await db.Event.findAndCountAll({
      where, order: [['startDate', 'ASC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });
    res.json({ events, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, authorize('events:read'), async (req, res) => {
  try {
    const event = await db.Event.findByPk(req.params.id, { include: [{ model: db.Volunteer }] });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, authorize('events:write'), async (req, res) => {
  try {
    const event = await db.Event.create(req.body);
    await db.AuditLog.create({ userId: req.user.id, action: 'CREATE_EVENT', entity: 'Event', entityId: event.id, ipAddress: req.ip });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, authorize('events:write'), async (req, res) => {
  try {
    const event = await db.Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await event.update(req.body);
    await db.AuditLog.create({ userId: req.user.id, action: 'UPDATE_EVENT', entity: 'Event', entityId: event.id, ipAddress: req.ip });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, authorize('events:delete'), async (req, res) => {
  try {
    const event = await db.Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await event.destroy();
    await db.AuditLog.create({ userId: req.user.id, action: 'DELETE_EVENT', entity: 'Event', entityId: req.params.id, ipAddress: req.ip });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
