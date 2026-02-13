const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

router.get('/', authenticateToken, authorize('newsletters:*'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    const { rows: newsletters, count } = await db.Newsletter.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit: parseInt(limit), offset: parseInt(offset)
    });
    res.json({ newsletters, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, authorize('newsletters:*'), async (req, res) => {
  try {
    const newsletter = await db.Newsletter.create(req.body);
    await db.AuditLog.create({ userId: req.user.id, action: 'CREATE_NEWSLETTER', entity: 'Newsletter', entityId: newsletter.id, ipAddress: req.ip });
    res.status(201).json(newsletter);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, authorize('newsletters:*'), async (req, res) => {
  try {
    const newsletter = await db.Newsletter.findByPk(req.params.id);
    if (!newsletter) return res.status(404).json({ error: 'Newsletter not found' });
    await newsletter.update(req.body);
    res.json(newsletter);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/send', authenticateToken, authorize('newsletters:*'), async (req, res) => {
  try {
    const newsletter = await db.Newsletter.findByPk(req.params.id);
    if (!newsletter) return res.status(404).json({ error: 'Newsletter not found' });
    const memberCount = await db.Member.count({ where: { membershipStatus: 'active' } });
    await newsletter.update({ status: 'sent', sentAt: new Date(), recipientCount: memberCount });
    console.log(`[STUB] Newsletter "${newsletter.id}" sent to ${memberCount} members`);
    res.json({ message: `Newsletter sent to ${memberCount} members` });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, authorize('newsletters:*'), async (req, res) => {
  try {
    await db.Newsletter.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Newsletter deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
