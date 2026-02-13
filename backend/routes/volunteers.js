const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/', authenticateToken, authorize('volunteers:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const { rows: volunteers, count } = await db.Volunteer.findAndCountAll({
      where, include: [{ model: db.Event, attributes: ['id', 'title', 'startDate'] }],
      order: [['createdAt', 'DESC']], limit: parseInt(limit), offset: parseInt(offset)
    });
    res.json({ volunteers, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, authorize('volunteers:write'), async (req, res) => {
  try {
    const volunteer = await db.Volunteer.create(req.body);
    await db.AuditLog.create({ userId: req.user.id, action: 'CREATE_VOLUNTEER', entity: 'Volunteer', entityId: volunteer.id, ipAddress: req.ip });
    res.status(201).json(volunteer);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, authorize('volunteers:write'), async (req, res) => {
  try {
    const volunteer = await db.Volunteer.findByPk(req.params.id);
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
    await volunteer.update(req.body);
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, authorize('volunteers:delete'), async (req, res) => {
  try {
    await db.Volunteer.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Volunteer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
