const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { createObjectCsvStringifier } = require('csv-writer');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');

// GET /api/exports/members/csv
router.get('/members/csv', authenticateToken, authorize('exports:members', 'exports:*'), async (req, res) => {
  try {
    const { status, nationality, fields } = req.query;
    const where = {};
    if (status) where.membershipStatus = status;
    if (nationality) where.nationality = nationality;

    const members = await db.Member.findAll({ where, order: [['lastName', 'ASC']] });

    const defaultFields = ['firstName', 'lastName', 'email', 'phone', 'nationality', 'membershipStatus', 'asylumStatus', 'city', 'membershipDate'];
    const selectedFields = fields ? fields.split(',') : defaultFields;

    const csvStringifier = createObjectCsvStringifier({
      header: selectedFields.map(f => ({ id: f, title: f.replace(/([A-Z])/g, ' $1').trim() }))
    });

    const records = members.map(m => {
      const obj = {};
      selectedFields.forEach(f => { obj[f] = m[f] || ''; });
      return obj;
    });

    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    await db.AuditLog.create({
      userId: req.user.id, action: 'EXPORT_MEMBERS_CSV', entity: 'Member',
      metadata: { count: members.length, filters: { status, nationality } }, ipAddress: req.ip
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=members_export_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/exports/members/pdf
router.get('/members/pdf', authenticateToken, authorize('exports:members', 'exports:*'), async (req, res) => {
  try {
    const { status, nationality } = req.query;
    const where = {};
    if (status) where.membershipStatus = status;
    if (nationality) where.nationality = nationality;

    const members = await db.Member.findAll({ where, order: [['lastName', 'ASC']] });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=members_export_${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('TÊKOȘÎN - Member Report', { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString('de-AT')}`, { align: 'center' });
    doc.fontSize(8).text('Verein für LGBTIQ-Geflüchtete und Migrant*innen in Wien', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(8);
    members.forEach((m, i) => {
      if (doc.y > 700) { doc.addPage(); }
      doc.text(`${i + 1}. ${m.lastName}, ${m.firstName} | ${m.email || 'N/A'} | ${m.nationality || 'N/A'} | ${m.membershipStatus}`, { continued: false });
      doc.moveDown(0.3);
    });

    doc.moveDown(2);
    doc.fontSize(8).text(`Total: ${members.length} members`, { align: 'right' });
    doc.text('Made with passion by Anna & Muco ❤️', { align: 'center' });

    doc.end();

    await db.AuditLog.create({
      userId: req.user.id, action: 'EXPORT_MEMBERS_PDF', entity: 'Member',
      metadata: { count: members.length }, ipAddress: req.ip
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/exports/payments/csv
router.get('/payments/csv', authenticateToken, authorize('exports:payments', 'exports:*'), async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const where = {};
    if (status) where.status = status;
    if (startDate && endDate) where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };

    const payments = await db.Payment.findAll({
      where, include: [{ model: db.Member, attributes: ['firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']]
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' }, { id: 'memberName', title: 'Member' },
        { id: 'amount', title: 'Amount (EUR)' }, { id: 'type', title: 'Type' },
        { id: 'status', title: 'Status' }, { id: 'date', title: 'Date' }
      ]
    });

    const records = payments.map(p => ({
      id: p.id, memberName: p.Member ? `${p.Member.firstName} ${p.Member.lastName}` : 'Anonymous',
      amount: p.amount, type: p.type, status: p.status,
      date: new Date(p.createdAt).toLocaleDateString('de-AT')
    }));

    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments_export_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/exports/reports
router.get('/reports', authenticateToken, authorize('reports:*', 'exports:*'), async (req, res) => {
  try {
    const { type = 'demographics' } = req.query;
    let data;

    switch (type) {
      case 'demographics':
        data = {
          byNationality: await db.Member.findAll({
            attributes: ['nationality', [db.sequelize.fn('COUNT', '*'), 'count']],
            group: ['nationality'], order: [[db.sequelize.fn('COUNT', '*'), 'DESC']]
          }),
          byGender: await db.Member.findAll({
            attributes: ['gender', [db.sequelize.fn('COUNT', '*'), 'count']],
            group: ['gender']
          }),
          byAsylumStatus: await db.Member.findAll({
            attributes: ['asylumStatus', [db.sequelize.fn('COUNT', '*'), 'count']],
            group: ['asylumStatus']
          }),
          byLanguage: await db.Member.findAll({
            attributes: [[db.sequelize.fn('unnest', db.sequelize.col('languages')), 'language']],
            raw: true
          })
        };
        break;
      case 'funding':
        data = {
          totalRevenue: await db.Payment.sum('amount', { where: { status: 'completed' } }),
          byMonth: await db.Payment.findAll({
            attributes: [
              [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt')), 'month'],
              [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total']
            ],
            where: { status: 'completed' },
            group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt'))],
            order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt')), 'DESC']],
            limit: 12
          }),
          byType: await db.Payment.findAll({
            attributes: ['type', [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total'], [db.sequelize.fn('COUNT', '*'), 'count']],
            where: { status: 'completed' },
            group: ['type']
          })
        };
        break;
      case 'utilization':
        data = {
          services: await db.Service.findAll({
            attributes: ['type', [db.sequelize.fn('COUNT', '*'), 'count']],
            group: ['type']
          }),
          events: await db.Event.findAll({
            attributes: ['type', [db.sequelize.fn('COUNT', '*'), 'count']],
            group: ['type']
          }),
          referrals: await db.Referral.findAll({
            attributes: ['type', [db.sequelize.fn('COUNT', '*'), 'count']],
            group: ['type']
          })
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.json({ type, generatedAt: new Date(), data });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
