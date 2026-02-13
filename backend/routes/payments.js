const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

const PAYPAL_API = process.env.PAYPAL_API || 'https://api-m.paypal.com';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data.access_token;
}

async function paypalRequest(method, url, data = null, retries = 0) {
  try {
    const token = await getPayPalAccessToken();
    const config = {
      method, url: `${PAYPAL_API}${url}`,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 15000
    };
    if (data) config.data = data;
    return await axios(config);
  } catch (error) {
    if (retries < MAX_RETRIES && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.response?.status >= 500)) {
      console.log(`PayPal retry ${retries + 1}/${MAX_RETRIES}...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY * (retries + 1)));
      return paypalRequest(method, url, data, retries + 1);
    }
    throw error;
  }
}

// GET /api/payments
router.get('/', authenticateToken, authorize('payments:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, memberId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (memberId) where.memberId = memberId;
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const { rows: payments, count } = await db.Payment.findAndCountAll({
      where,
      include: [{ model: db.Member, attributes: ['firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      payments,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    console.error('List payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payments/stats
router.get('/stats', authenticateToken, authorize('payments:read'), async (req, res) => {
  try {
    const totalRevenue = await db.Payment.sum('amount', { where: { status: 'completed' } }) || 0;
    const monthlyRevenue = await db.Payment.sum('amount', {
      where: { status: 'completed', createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
    }) || 0;
    const totalPayments = await db.Payment.count();
    const completedPayments = await db.Payment.count({ where: { status: 'completed' } });
    const pendingPayments = await db.Payment.count({ where: { status: 'pending' } });
    const refundedPayments = await db.Payment.count({ where: { status: 'refunded' } });

    const recentPayments = await db.Payment.findAll({
      where: { status: 'completed' },
      include: [{ model: db.Member, attributes: ['firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const monthlyTrend = await db.Payment.findAll({
      attributes: [
        [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt')), 'month'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: { status: 'completed' },
      group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt'))],
      order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('createdAt')), 'DESC']],
      limit: 12
    });

    res.json({ totalRevenue, monthlyRevenue, totalPayments, completedPayments, pendingPayments, refundedPayments, recentPayments, monthlyTrend });
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payments/create-order (server-side PayPal order creation)
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { amount, description, memberId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'EUR', value: parseFloat(amount).toFixed(2) },
        description: description || 'TÊKOȘÎN Donation'
      }]
    };

    const response = await paypalRequest('post', '/v2/checkout/orders', orderData);

    const payment = await db.Payment.create({
      memberId: memberId || null,
      paypalOrderId: response.data.id,
      amount: parseFloat(amount),
      currency: 'EUR',
      type: 'one_time',
      status: 'pending',
      description: description || 'TÊKOȘÎN Donation',
      metadata: { paypalResponse: response.data }
    });

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'CREATE_PAYPAL_ORDER',
      entity: 'Payment',
      entityId: payment.id,
      newValues: { amount, orderId: response.data.id },
      ipAddress: req.ip
    });

    res.json({ orderId: response.data.id, paymentId: payment.id });
  } catch (error) {
    console.error('Create PayPal order error:', error.response?.data || error.message);
    const payment = await db.Payment.create({
      amount: req.body.amount || 0,
      currency: 'EUR',
      type: 'one_time',
      status: 'failed',
      lastError: error.message,
      retryCount: MAX_RETRIES
    });
    res.status(500).json({ error: 'Network error. Please try again.', paymentId: payment.id });
  }
});

// POST /api/payments/capture-order
router.post('/capture-order', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID required' });

    const response = await paypalRequest('post', `/v2/checkout/orders/${orderId}/capture`);

    const payment = await db.Payment.findOne({ where: { paypalOrderId: orderId } });
    if (payment) {
      await payment.update({
        status: 'completed',
        payerEmail: response.data.payer?.email_address,
        payerName: `${response.data.payer?.name?.given_name || ''} ${response.data.payer?.name?.surname || ''}`.trim(),
        ipnData: response.data,
        metadata: { ...payment.metadata, captureResponse: response.data }
      });
    }

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'CAPTURE_PAYPAL_ORDER',
      entity: 'Payment',
      entityId: payment?.id,
      newValues: { orderId, status: 'completed' },
      ipAddress: req.ip
    });

    res.json({ status: 'completed', details: response.data });
  } catch (error) {
    console.error('Capture order error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Network error. Please try again.' });
  }
});

// POST /api/payments/create-subscription
router.post('/create-subscription', authenticateToken, async (req, res) => {
  try {
    const { planId, memberId } = req.body;
    if (!planId) return res.status(400).json({ error: 'Plan ID required' });

    const subscriptionData = {
      plan_id: planId,
      application_context: {
        brand_name: 'TÊKOȘÎN',
        return_url: `${process.env.FRONTEND_URL}/payments/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payments/cancel`
      }
    };

    const response = await paypalRequest('post', '/v1/billing/subscriptions', subscriptionData);

    const payment = await db.Payment.create({
      memberId: memberId || null,
      paypalSubscriptionId: response.data.id,
      amount: 0,
      currency: 'EUR',
      type: 'subscription',
      status: 'pending',
      metadata: { subscriptionResponse: response.data }
    });

    res.json({ subscriptionId: response.data.id, approvalUrl: response.data.links?.find(l => l.rel === 'approve')?.href, paymentId: payment.id });
  } catch (error) {
    console.error('Create subscription error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Network error. Please try again.' });
  }
});

// POST /api/payments/:id/refund
router.post('/:id/refund', authenticateToken, authorize('payments:refund'), async (req, res) => {
  try {
    const payment = await db.Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'completed') return res.status(400).json({ error: 'Only completed payments can be refunded' });

    const { reason } = req.body;

    if (payment.paypalOrderId) {
      try {
        const orderDetails = await paypalRequest('get', `/v2/checkout/orders/${payment.paypalOrderId}`);
        const captureId = orderDetails.data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
        if (captureId) {
          await paypalRequest('post', `/v2/payments/captures/${captureId}/refund`, {
            amount: { value: payment.amount.toString(), currency_code: 'EUR' }
          });
        }
      } catch (ppError) {
        console.error('PayPal refund error:', ppError.message);
      }
    }

    await payment.update({
      status: 'refunded',
      refundReason: reason || 'Admin initiated refund',
      refundedAt: new Date()
    });

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'REFUND_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
      newValues: { status: 'refunded', reason },
      ipAddress: req.ip
    });

    res.json({ message: 'Payment refunded', payment });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payments/ipn (IPN webhook)
router.post('/ipn', async (req, res) => {
  try {
    console.log('PayPal IPN received:', JSON.stringify(req.body));
    const { resource, event_type } = req.body;

    if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = resource?.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        const payment = await db.Payment.findOne({ where: { paypalOrderId: orderId } });
        if (payment) {
          await payment.update({ status: 'completed', ipnData: req.body });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('IPN error:', error);
    res.status(200).json({ received: true });
  }
});

// POST /api/payments/manual
router.post('/manual', authenticateToken, authorize('payments:write'), async (req, res) => {
  try {
    const { amount, memberId, description, type } = req.body;
    const payment = await db.Payment.create({
      memberId, amount, currency: 'EUR',
      type: type || 'one_time', status: 'completed',
      description, payerName: 'Manual Entry'
    });

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'MANUAL_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
      newValues: { amount, memberId },
      ipAddress: req.ip
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
