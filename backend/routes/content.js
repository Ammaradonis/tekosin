const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/content
router.get('/', authenticateToken, authorize('content:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) where.slug = { [Op.iLike]: `%${search}%` };

    const { rows: contents, count } = await db.Content.findAndCountAll({
      where,
      include: [{ model: db.User, as: 'author', attributes: ['firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ contents, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('List content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content/:id
router.get('/:id', authenticateToken, authorize('content:read'), async (req, res) => {
  try {
    const content = await db.Content.findByPk(req.params.id, {
      include: [{ model: db.User, as: 'author', attributes: ['firstName', 'lastName'] }]
    });
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/content
router.post('/', authenticateToken, authorize('content:write'), async (req, res) => {
  try {
    const { title, slug, body, excerpt, type, status, category, tags, featuredImage } = req.body;
    const existing = await db.Content.findOne({ where: { slug } });
    if (existing) return res.status(409).json({ error: 'Slug already exists' });

    const content = await db.Content.create({
      authorId: req.user.id, title, slug, body, excerpt, type, status,
      category, tags, featuredImage,
      publishedAt: status === 'published' ? new Date() : null
    });

    await db.AuditLog.create({
      userId: req.user.id, action: 'CREATE_CONTENT', entity: 'Content',
      entityId: content.id, newValues: { title, slug, type }, ipAddress: req.ip
    });

    res.status(201).json(content);
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/content/:id
router.put('/:id', authenticateToken, authorize('content:write'), async (req, res) => {
  try {
    const content = await db.Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const updateData = { ...req.body };
    if (updateData.status === 'published' && content.status !== 'published') {
      updateData.publishedAt = new Date();
    }
    updateData.version = content.version + 1;

    await content.update(updateData);
    await db.AuditLog.create({
      userId: req.user.id, action: 'UPDATE_CONTENT', entity: 'Content',
      entityId: content.id, ipAddress: req.ip
    });

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/content/:id
router.delete('/:id', authenticateToken, authorize('content:delete'), async (req, res) => {
  try {
    const content = await db.Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Content not found' });
    await content.destroy();
    await db.AuditLog.create({
      userId: req.user.id, action: 'DELETE_CONTENT', entity: 'Content',
      entityId: req.params.id, ipAddress: req.ip
    });
    res.json({ message: 'Content deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/content/:id/publish
router.post('/:id/publish', authenticateToken, authorize('content:publish'), async (req, res) => {
  try {
    const content = await db.Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ error: 'Content not found' });
    await content.update({ status: 'published', publishedAt: new Date() });
    res.json({ message: 'Content published', content });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
