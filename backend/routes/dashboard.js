const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/dashboard
router.get('/', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalMembers, activeMembers, pendingMembers,
      totalPayments, monthRevenue,
      totalEvents, upcomingEvents,
      totalVolunteers,
      recentAuditLogs, unreadNotifications,
      newMembersThisMonth, newMembersThisWeek
    ] = await Promise.all([
      db.Member.count(),
      db.Member.count({ where: { membershipStatus: 'active' } }),
      db.Member.count({ where: { membershipStatus: 'pending' } }),
      db.Payment.count({ where: { status: 'completed' } }),
      db.Payment.sum('amount', { where: { status: 'completed', createdAt: { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
      db.Event.count(),
      db.Event.count({ where: { startDate: { [Op.gte]: now }, status: 'planned' } }),
      db.Volunteer.count({ where: { status: 'active' } }),
      db.AuditLog.findAll({ order: [['createdAt', 'DESC']], limit: 10, include: [{ model: db.User, attributes: ['firstName', 'lastName', 'email'] }] }),
      db.Notification.count({ where: { userId: req.user.id, isRead: false } }),
      db.Member.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
      db.Member.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } })
    ]);

    // Monthly member growth (last 12 months)
    const memberGrowth = await db.Member.findAll({
      attributes: [
        [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt')), 'month'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt'))],
      order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt')), 'ASC']],
      limit: 12
    });

    // Payment trend (last 12 months)
    const paymentTrend = await db.Payment.findAll({
      attributes: [
        [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt')), 'month'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: { status: 'completed' },
      group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt'))],
      order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt')), 'ASC']],
      limit: 12
    });

    // Nationality distribution
    const nationalityDist = await db.Member.findAll({
      attributes: ['nationality', [db.sequelize.fn('COUNT', db.sequelize.col('nationality')), 'count']],
      where: { nationality: { [Op.not]: null } },
      group: ['nationality'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('nationality')), 'DESC']],
      limit: 10
    });

    // Crisis events (mock dynamic countdown timers)
    const crisisEvents = [
      { id: 1, title: 'URGENT: Lives at Stake!', description: 'Emergency fundraiser for displaced LGBTIQ+ refugees', expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), type: 'fundraiser' },
      { id: 2, title: 'SHOCKING REALITY: Act Now!', description: 'Critical support needed for new arrivals', expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), type: 'support' },
      { id: 3, title: 'CRISIS ALERT: Your Action Saves Lives!', description: 'Volunteer recruitment drive ending soon', expiresAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), type: 'volunteer' }
    ];

    res.json({
      stats: {
        totalMembers, activeMembers, pendingMembers,
        totalPayments, monthRevenue: monthRevenue || 0,
        totalEvents, upcomingEvents,
        totalVolunteers,
        unreadNotifications,
        newMembersThisMonth, newMembersThisWeek
      },
      charts: { memberGrowth, paymentTrend, nationalityDist },
      recentActivity: recentAuditLogs,
      crisisEvents
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/health
router.get('/health', authenticateToken, async (req, res) => {
  try {
    await db.sequelize.authenticate();
    const dbStatus = 'healthy';
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.json({
      status: 'healthy',
      database: dbStatus,
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

module.exports = router;
