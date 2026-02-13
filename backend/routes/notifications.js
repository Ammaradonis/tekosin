const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };
    if (unread === 'true') where.isRead = false;

    const { rows: notifications, count } = await db.Notification.findAndCountAll({
      where, order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });
    const unreadCount = await db.Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ notifications, unreadCount, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await db.Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    await notification.update({ isRead: true, readAt: new Date() });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await db.Notification.update({ isRead: true, readAt: new Date() }, { where: { userId: req.user.id, isRead: false } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, authorize('notifications:*'), async (req, res) => {
  try {
    const { userId, type, channel, title, message, actionUrl, scheduledFor } = req.body;
    const notification = await db.Notification.create({ userId, type, channel, title, message, actionUrl, scheduledFor });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/bulk', authenticateToken, authorize('notifications:*'), async (req, res) => {
  try {
    const { userIds, type, channel, title, message } = req.body;
    const notifications = await db.Notification.bulkCreate(
      userIds.map(userId => ({ userId, type, channel, title, message }))
    );
    res.status(201).json({ message: `${notifications.length} notifications sent`, count: notifications.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.Notification.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
