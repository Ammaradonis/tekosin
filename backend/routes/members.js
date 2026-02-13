const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const db = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, uuidParam } = require('../middleware/validation');
const { Op } = require('sequelize');
const CryptoJS = require('crypto-js');

const encryptField = (data) => {
  if (!data) return null;
  return CryptoJS.AES.encrypt(JSON.stringify(data), process.env.ENCRYPTION_KEY).toString();
};

const decryptField = (encrypted) => {
  if (!encrypted) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, process.env.ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch { return null; }
};

// GET /api/members
router.get('/', authenticateToken, authorize('members:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, nationality, asylumStatus, sort = 'createdAt', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (status) where.membershipStatus = status;
    if (nationality) where.nationality = nationality;
    if (asylumStatus) where.asylumStatus = asylumStatus;

    const { rows: members, count } = await db.Member.findAndCountAll({
      where,
      include: [{ model: db.User, attributes: ['email', 'role', 'isActive'] }],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      members,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/members/stats
router.get('/stats', authenticateToken, authorize('members:read'), async (req, res) => {
  try {
    const total = await db.Member.count();
    const active = await db.Member.count({ where: { membershipStatus: 'active' } });
    const pending = await db.Member.count({ where: { membershipStatus: 'pending' } });
    const inactive = await db.Member.count({ where: { membershipStatus: 'inactive' } });

    const byNationality = await db.Member.findAll({
      attributes: ['nationality', [db.sequelize.fn('COUNT', db.sequelize.col('nationality')), 'count']],
      group: ['nationality'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('nationality')), 'DESC']],
      limit: 10
    });

    const byAsylumStatus = await db.Member.findAll({
      attributes: ['asylumStatus', [db.sequelize.fn('COUNT', db.sequelize.col('asylumStatus')), 'count']],
      group: ['asylumStatus']
    });

    const byGender = await db.Member.findAll({
      attributes: ['gender', [db.sequelize.fn('COUNT', db.sequelize.col('gender')), 'count']],
      group: ['gender']
    });

    const recentMembers = await db.Member.count({
      where: { createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });

    res.json({ total, active, pending, inactive, recentMembers, byNationality, byAsylumStatus, byGender });
  } catch (error) {
    console.error('Member stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/members/:id
router.get('/:id', authenticateToken, authorize('members:read'), async (req, res) => {
  try {
    const member = await db.Member.findByPk(req.params.id, {
      include: [
        { model: db.User, attributes: ['email', 'role', 'isActive', 'lastLogin'] },
        { model: db.Payment },
        { model: db.Document },
        { model: db.Note },
        { model: db.Service },
        { model: db.Referral }
      ]
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (member.encryptedData) {
      member.dataValues.decryptedSensitiveData = decryptField(member.encryptedData);
    }

    res.json(member);
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/members
router.post('/', authenticateToken, authorize('members:write'), [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  validate
], async (req, res) => {
  try {
    const memberData = { ...req.body };

    if (memberData.healthNotes || memberData.specialNeeds) {
      memberData.encryptedData = encryptField({
        healthNotes: memberData.healthNotes,
        specialNeeds: memberData.specialNeeds
      });
    }

    memberData.gdprConsent = true;
    memberData.gdprConsentDate = new Date();

    const member = await db.Member.create(memberData);

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'CREATE_MEMBER',
      entity: 'Member',
      entityId: member.id,
      newValues: { firstName: member.firstName, lastName: member.lastName },
      ipAddress: req.ip
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/members/:id
router.put('/:id', authenticateToken, authorize('members:write'), async (req, res) => {
  try {
    const member = await db.Member.findByPk(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const oldValues = member.toJSON();
    const updateData = { ...req.body };

    if (updateData.healthNotes || updateData.specialNeeds) {
      updateData.encryptedData = encryptField({
        healthNotes: updateData.healthNotes,
        specialNeeds: updateData.specialNeeds
      });
    }

    await member.update(updateData);

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'UPDATE_MEMBER',
      entity: 'Member',
      entityId: member.id,
      oldValues: { firstName: oldValues.firstName, lastName: oldValues.lastName, membershipStatus: oldValues.membershipStatus },
      newValues: { firstName: member.firstName, lastName: member.lastName, membershipStatus: member.membershipStatus },
      ipAddress: req.ip
    });

    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/members/:id
router.delete('/:id', authenticateToken, authorize('members:delete'), async (req, res) => {
  try {
    const member = await db.Member.findByPk(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    await member.destroy();
    await db.AuditLog.create({
      userId: req.user.id,
      action: 'DELETE_MEMBER',
      entity: 'Member',
      entityId: req.params.id,
      ipAddress: req.ip
    });

    res.json({ message: 'Member archived' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/members/bulk
router.post('/bulk', authenticateToken, authorize('members:write'), async (req, res) => {
  try {
    const { action, memberIds } = req.body;
    if (!memberIds || !memberIds.length) return res.status(400).json({ error: 'No members selected' });

    let result;
    switch (action) {
      case 'activate':
        result = await db.Member.update({ membershipStatus: 'active' }, { where: { id: memberIds } });
        break;
      case 'deactivate':
        result = await db.Member.update({ membershipStatus: 'inactive' }, { where: { id: memberIds } });
        break;
      case 'delete':
        result = await db.Member.destroy({ where: { id: memberIds } });
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await db.AuditLog.create({
      userId: req.user.id,
      action: `BULK_${action.toUpperCase()}`,
      entity: 'Member',
      metadata: { memberIds, count: memberIds.length },
      ipAddress: req.ip
    });

    res.json({ message: `Bulk ${action} completed`, affected: memberIds.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GDPR: Right to be forgotten
router.delete('/:id/gdpr-forget', authenticateToken, authorize('members:delete'), async (req, res) => {
  try {
    const member = await db.Member.findByPk(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    await member.update({
      firstName: 'DELETED', lastName: 'DELETED', email: null, phone: null,
      address: null, dateOfBirth: null, healthNotes: null, specialNeeds: null,
      encryptedData: null, emergencyContactName: null, emergencyContactPhone: null,
      notes: null, membershipStatus: 'archived'
    });

    await db.Document.destroy({ where: { memberId: member.id }, force: true });
    await db.Note.destroy({ where: { memberId: member.id }, force: true });

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'GDPR_FORGET',
      entity: 'Member',
      entityId: member.id,
      ipAddress: req.ip
    });

    res.json({ message: 'Member data erased per GDPR right to be forgotten' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GDPR: Data portability
router.get('/:id/gdpr-export', authenticateToken, authorize('members:read'), async (req, res) => {
  try {
    const member = await db.Member.findByPk(req.params.id, {
      include: [{ model: db.Payment }, { model: db.Document, attributes: ['name', 'type', 'status'] }, { model: db.Service }, { model: db.Referral }]
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    res.json({ gdprExport: true, exportDate: new Date(), data: member });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
