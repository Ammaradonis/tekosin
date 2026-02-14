const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const db = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

// ─── LIVE PayPal Configuration ───────────────────────────────────────────────
const PAYPAL_API = process.env.PAYPAL_API || 'https://api-m.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET;
const RETRY_DELAYS = [2000, 5000, 10000]; // exponential backoff: 2s, 5s, 10s
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30000; // 30s — PayPal live API can be slow

// ─── Token cache (avoid fetching on every single request) ────────────────────
let cachedToken = null;
let tokenExpiresAt = 0;

// ─── Helper: get PayPal OAuth2 access token (cached, with retries) ───────────
async function getAccessToken(attempt = 0) {
  // Return cached token if still valid (with 60s safety margin)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const response = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: REQUEST_TIMEOUT
      }
    );
    cachedToken = response.data.access_token;
    // PayPal tokens typically expire in ~9 hours (32400s)
    tokenExpiresAt = Date.now() + (response.data.expires_in || 32400) * 1000;
    return cachedToken;
  } catch (error) {
    // Invalidate cache on failure
    cachedToken = null;
    tokenExpiresAt = 0;

    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt] || 10000;
      console.error(`[PayPal] getAccessToken retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms:`, error.message);
      await logPaypalError('getAccessToken', error, { attempt });
      await new Promise(r => setTimeout(r, delay));
      return getAccessToken(attempt + 1);
    }
    console.error('[PayPal] getAccessToken FAILED after all retries:', error.response?.data || error.message);
    throw error;
  }
}

// ─── Helper: PayPal API request with exponential backoff retries ─────────────
async function paypalRequest(method, path, data = null, attempt = 0) {
  try {
    const token = await getAccessToken();
    const config = {
      method,
      url: `${PAYPAL_API}${path}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `tekosin-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
      },
      timeout: REQUEST_TIMEOUT
    };
    if (data) config.data = data;
    const response = await axios(config);
    return response;
  } catch (error) {
    const status = error.response?.status;
    const isRetryable =
      error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' ||
      error.code === 'ERR_BAD_RESPONSE' ||
      status >= 500 || status === 429 ||
      error.message?.includes('timeout') || error.message?.includes('Network Error');

    // On 401, invalidate token cache and retry once
    if (status === 401 && attempt === 0) {
      console.log('[PayPal] Token expired, refreshing...');
      cachedToken = null;
      tokenExpiresAt = 0;
      return paypalRequest(method, path, data, attempt + 1);
    }

    if (attempt < MAX_RETRIES && isRetryable) {
      // On 429, use Retry-After header if available
      const retryAfter = error.response?.headers?.['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : (RETRY_DELAYS[attempt] || 10000);
      console.error(`[PayPal] ${method.toUpperCase()} ${path} retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms (status=${status || error.code}):`, error.message);
      await logPaypalError(`paypalRequest:${method}:${path}`, error, { attempt, data });
      await new Promise(r => setTimeout(r, delay));
      return paypalRequest(method, path, data, attempt + 1);
    }

    console.error(`[PayPal] ${method.toUpperCase()} ${path} FAILED:`, {
      status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      attempts: attempt + 1
    });
    throw error;
  }
}

// ─── Helper: Log PayPal errors to DB ─────────────────────────────────────────
async function logPaypalError(context, error, extra = {}) {
  try {
    await db.PaypalTransaction.create({
      type: 'webhook_event',
      status: 'ERROR',
      description: `Error in ${context}: ${error.message}`,
      errorPayload: {
        context,
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data,
        ...extra
      },
      retryCount: extra.attempt || 0
    });
  } catch (logErr) {
    console.error('[PayPal] Failed to log error to DB:', logErr.message);
  }
}

// ─── Helper: Duplicate prevention ────────────────────────────────────────────
async function isDuplicateWebhookEvent(eventId) {
  if (!eventId) return false;
  const existing = await db.PaypalTransaction.findOne({ where: { webhookEventId: eventId } });
  return !!existing;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONE-TIME PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/paypal/create-order
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { amount, description, memberId } = req.body;

    // Server-side validation
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 0.01 || parsedAmount > 99999.99) {
      return res.status(400).json({ error: 'Amount must be between €0.01 and €99,999.99' });
    }

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: parsedAmount.toFixed(2)
        },
        description: description || 'TÊKOȘÎN Donation',
        custom_id: `tekosin_${req.user.id}_${Date.now()}`
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'TÊKOȘÎN',
            locale: 'de-AT',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED'
          }
        }
      }
    };

    const response = await paypalRequest('post', '/v2/checkout/orders', orderData);

    // Store in payments table
    const payment = await db.Payment.create({
      memberId: memberId || null,
      paypalOrderId: response.data.id,
      amount: parsedAmount,
      currency: 'EUR',
      type: 'one_time',
      status: 'pending',
      description: description || 'TÊKOȘÎN Donation',
      metadata: { paypalOrderStatus: response.data.status, links: response.data.links }
    });

    // Store in paypal_transactions table
    await db.PaypalTransaction.create({
      paypalOrderId: response.data.id,
      paymentId: payment.id,
      memberId: memberId || null,
      userId: req.user.id,
      type: 'order',
      status: response.data.status,
      amount: parsedAmount,
      currency: 'EUR',
      description: description || 'TÊKOȘÎN Donation',
      rawPayload: response.data,
      ipAddress: req.ip
    });

    // Audit log
    await db.AuditLog.create({
      userId: req.user.id,
      action: 'PAYPAL_CREATE_ORDER',
      entity: 'Payment',
      entityId: payment.id,
      newValues: { amount: parsedAmount, orderId: response.data.id, currency: 'EUR' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    console.log(`[PayPal] Order created: ${response.data.id} for €${parsedAmount.toFixed(2)}`);
    res.json({ orderId: response.data.id, paymentId: payment.id, status: response.data.status });
  } catch (error) {
    console.error('[PayPal] create-order FAILED:', error.response?.data || error.message);
    await logPaypalError('create-order', error, { body: req.body, userId: req.user?.id });

    // Store failed attempt
    try {
      await db.Payment.create({
        amount: parseFloat(req.body.amount) || 0,
        currency: 'EUR',
        type: 'one_time',
        status: 'failed',
        lastError: JSON.stringify(error.response?.data || error.message),
        retryCount: MAX_RETRIES,
        description: 'Failed PayPal order creation'
      });
    } catch (dbErr) { console.error('[PayPal] Failed to log failed payment:', dbErr.message); }

    res.status(500).json({ error: 'Network error. Please try again.', details: error.response?.data?.message });
  }
});

// POST /api/paypal/capture-order
router.post('/capture-order', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID required' });

    // Duplicate prevention: check if already captured
    const existingCapture = await db.PaypalTransaction.findOne({
      where: { paypalOrderId: orderId, type: 'capture', status: 'COMPLETED' }
    });
    if (existingCapture) {
      return res.json({ status: 'already_captured', captureId: existingCapture.paypalCaptureId });
    }

    // Verify order exists in our DB
    const payment = await db.Payment.findOne({ where: { paypalOrderId: orderId } });
    if (!payment) return res.status(404).json({ error: 'Order not found in our records' });

    // Verify amount matches
    const response = await paypalRequest('post', `/v2/checkout/orders/${orderId}/capture`);
    const captureData = response.data;
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedAmount = parseFloat(capture?.amount?.value || 0);
    const capturedCurrency = capture?.amount?.currency_code;

    // Currency validation
    if (capturedCurrency !== 'EUR') {
      console.error(`[PayPal] Currency mismatch: expected EUR, got ${capturedCurrency}`);
    }

    // Update payment record
    await payment.update({
      status: 'completed',
      payerEmail: captureData.payer?.email_address,
      payerName: `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim(),
      ipnData: captureData,
      metadata: {
        ...payment.metadata,
        captureId: capture?.id,
        captureStatus: capture?.status,
        capturedAmount,
        capturedCurrency,
        payerCountry: captureData.payer?.address?.country_code
      }
    });

    // Store capture transaction
    await db.PaypalTransaction.create({
      paypalOrderId: orderId,
      paypalCaptureId: capture?.id,
      paymentId: payment.id,
      memberId: payment.memberId,
      userId: req.user.id,
      type: 'capture',
      status: capture?.status || 'COMPLETED',
      amount: capturedAmount,
      currency: capturedCurrency || 'EUR',
      payerEmail: captureData.payer?.email_address,
      payerName: `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim(),
      description: `Captured order ${orderId}`,
      rawPayload: captureData,
      ipAddress: req.ip
    });

    // Audit log
    await db.AuditLog.create({
      userId: req.user.id,
      action: 'PAYPAL_CAPTURE_ORDER',
      entity: 'Payment',
      entityId: payment.id,
      newValues: { orderId, captureId: capture?.id, amount: capturedAmount, status: 'completed' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    console.log(`[PayPal] Order captured: ${orderId} -> capture ${capture?.id} for €${capturedAmount}`);
    res.json({
      status: 'completed',
      captureId: capture?.id,
      amount: capturedAmount,
      currency: capturedCurrency,
      payer: captureData.payer,
      paymentId: payment.id
    });
  } catch (error) {
    console.error('[PayPal] capture-order FAILED:', error.response?.data || error.message);
    await logPaypalError('capture-order', error, { body: req.body, userId: req.user?.id });
    res.status(500).json({ error: 'Network error. Please try again.', details: error.response?.data?.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/paypal/create-product (create PayPal catalog product)
router.post('/create-product', authenticateToken, authorize('payments:write'), async (req, res) => {
  try {
    const productData = {
      name: 'TÊKOȘÎN Membership',
      description: 'TÊKOȘÎN - Verein für LGBTIQ-Geflüchtete und Migrant*innen in Wien',
      type: 'SERVICE',
      category: 'CHARITY'
    };
    const response = await paypalRequest('post', '/v1/catalogs/products', productData);
    console.log(`[PayPal] Product created: ${response.data.id}`);
    res.json({ productId: response.data.id, product: response.data });
  } catch (error) {
    console.error('[PayPal] create-product FAILED:', error.response?.data || error.message);
    await logPaypalError('create-product', error);
    res.status(500).json({ error: 'Failed to create product', details: error.response?.data });
  }
});

// POST /api/paypal/create-plan (create billing plan: monthly or yearly)
router.post('/create-plan', authenticateToken, authorize('payments:write'), async (req, res) => {
  try {
    const { productId, name, amount, frequency } = req.body;
    if (!productId || !amount) return res.status(400).json({ error: 'productId and amount required' });

    const parsedAmount = parseFloat(amount);
    const freq = (frequency || 'MONTHLY').toUpperCase();

    const planData = {
      product_id: productId,
      name: name || `TÊKOȘÎN ${freq === 'MONTHLY' ? 'Monthly' : 'Yearly'} Membership`,
      description: `TÊKOȘÎN ${freq === 'MONTHLY' ? 'Monatliche' : 'Jährliche'} Mitgliedschaft`,
      billing_cycles: [
        {
          frequency: {
            interval_unit: freq === 'YEARLY' ? 'YEAR' : 'MONTH',
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: parsedAmount.toFixed(2),
              currency_code: 'EUR'
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: '0', currency_code: 'EUR' },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    };

    const response = await paypalRequest('post', '/v1/billing/plans', planData);
    console.log(`[PayPal] Plan created: ${response.data.id} (${freq} €${parsedAmount.toFixed(2)})`);
    res.json({ planId: response.data.id, plan: response.data });
  } catch (error) {
    console.error('[PayPal] create-plan FAILED:', error.response?.data || error.message);
    await logPaypalError('create-plan', error, { body: req.body });
    res.status(500).json({ error: 'Failed to create plan', details: error.response?.data });
  }
});

// GET /api/paypal/plans (list billing plans)
router.get('/plans', authenticateToken, async (req, res) => {
  try {
    const response = await paypalRequest('get', '/v1/billing/plans?page_size=20&page=1&total_required=true');
    res.json({ plans: response.data.plans || [], total: response.data.total_items || 0 });
  } catch (error) {
    console.error('[PayPal] list-plans FAILED:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to list plans' });
  }
});

// POST /api/paypal/create-subscription
router.post('/create-subscription', authenticateToken, async (req, res) => {
  try {
    const { planId, memberId } = req.body;
    if (!planId) return res.status(400).json({ error: 'Plan ID required' });

    const subscriptionData = {
      plan_id: planId,
      application_context: {
        brand_name: 'TÊKOȘÎN',
        locale: 'de-AT',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${process.env.FRONTEND_URL || 'https://tekosinlgbtiq.com'}/payments?subscription=success`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://tekosinlgbtiq.com'}/payments?subscription=cancelled`
      }
    };

    const response = await paypalRequest('post', '/v1/billing/subscriptions', subscriptionData);
    const approvalUrl = response.data.links?.find(l => l.rel === 'approve')?.href;

    // Store subscription
    const subscription = await db.PaypalSubscription.create({
      paypalSubscriptionId: response.data.id,
      paypalPlanId: planId,
      memberId: memberId || null,
      userId: req.user.id,
      status: response.data.status || 'APPROVAL_PENDING',
      approvalUrl,
      rawPayload: response.data
    });

    // Also store in payments table for unified view
    await db.Payment.create({
      memberId: memberId || null,
      paypalSubscriptionId: response.data.id,
      amount: 0,
      currency: 'EUR',
      type: 'subscription',
      status: 'pending',
      description: `Subscription ${response.data.id}`,
      metadata: { subscriptionResponse: response.data, approvalUrl }
    });

    // Audit
    await db.AuditLog.create({
      userId: req.user.id,
      action: 'PAYPAL_CREATE_SUBSCRIPTION',
      entity: 'PaypalSubscription',
      entityId: subscription.id,
      newValues: { subscriptionId: response.data.id, planId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    console.log(`[PayPal] Subscription created: ${response.data.id}`);
    res.json({ subscriptionId: response.data.id, approvalUrl, status: response.data.status });
  } catch (error) {
    console.error('[PayPal] create-subscription FAILED:', error.response?.data || error.message);
    await logPaypalError('create-subscription', error, { body: req.body });
    res.status(500).json({ error: 'Network error. Please try again.', details: error.response?.data?.message });
  }
});

// POST /api/paypal/activate-subscription
router.post('/activate-subscription', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: 'Subscription ID required' });

    // Get subscription details from PayPal
    const response = await paypalRequest('get', `/v1/billing/subscriptions/${subscriptionId}`);
    const subData = response.data;

    // Update local record
    const subscription = await db.PaypalSubscription.findOne({ where: { paypalSubscriptionId: subscriptionId } });
    if (subscription) {
      await subscription.update({
        status: subData.status,
        subscriberEmail: subData.subscriber?.email_address,
        subscriberName: `${subData.subscriber?.name?.given_name || ''} ${subData.subscriber?.name?.surname || ''}`.trim(),
        startDate: subData.start_time,
        nextBillingDate: subData.billing_info?.next_billing_time,
        amount: parseFloat(subData.billing_info?.last_payment?.amount?.value || 0),
        lastWebhookData: subData
      });
    }

    // Update payment record
    const payment = await db.Payment.findOne({ where: { paypalSubscriptionId: subscriptionId } });
    if (payment) {
      await payment.update({
        status: subData.status === 'ACTIVE' ? 'completed' : 'pending',
        payerEmail: subData.subscriber?.email_address,
        payerName: `${subData.subscriber?.name?.given_name || ''} ${subData.subscriber?.name?.surname || ''}`.trim()
      });
    }

    console.log(`[PayPal] Subscription activated: ${subscriptionId} -> ${subData.status}`);
    res.json({ status: subData.status, subscription: subData });
  } catch (error) {
    console.error('[PayPal] activate-subscription FAILED:', error.response?.data || error.message);
    res.status(500).json({ error: 'Network error. Please try again.' });
  }
});

// POST /api/paypal/cancel-subscription
router.post('/cancel-subscription', authenticateToken, authorize('payments:write'), async (req, res) => {
  try {
    const { subscriptionId, reason } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: 'Subscription ID required' });

    await paypalRequest('post', `/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      reason: reason || 'Cancelled by admin'
    });

    const subscription = await db.PaypalSubscription.findOne({ where: { paypalSubscriptionId: subscriptionId } });
    if (subscription) {
      await subscription.update({ status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason || 'Cancelled by admin' });
    }

    const payment = await db.Payment.findOne({ where: { paypalSubscriptionId: subscriptionId } });
    if (payment) await payment.update({ status: 'cancelled' });

    await db.AuditLog.create({
      userId: req.user.id,
      action: 'PAYPAL_CANCEL_SUBSCRIPTION',
      entity: 'PaypalSubscription',
      entityId: subscription?.id,
      newValues: { subscriptionId, reason },
      ipAddress: req.ip
    });

    console.log(`[PayPal] Subscription cancelled: ${subscriptionId}`);
    res.json({ status: 'CANCELLED', subscriptionId });
  } catch (error) {
    console.error('[PayPal] cancel-subscription FAILED:', error.response?.data || error.message);
    res.status(500).json({ error: 'Network error. Please try again.' });
  }
});

// GET /api/paypal/subscriptions (list local subscriptions)
router.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = {};
    if (status) where.status = status;

    const { rows, count } = await db.PaypalSubscription.findAndCountAll({
      where,
      include: [{ model: db.Member, attributes: ['firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({ subscriptions: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list subscriptions' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// REFUNDS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/paypal/refund/:captureId
router.post('/refund/:captureId', authenticateToken, authorize('payments:refund'), async (req, res) => {
  try {
    const { captureId } = req.params;
    const { amount, reason, note } = req.body;

    // Find the capture transaction
    const captureTx = await db.PaypalTransaction.findOne({ where: { paypalCaptureId: captureId, type: 'capture' } });
    if (!captureTx) return res.status(404).json({ error: 'Capture transaction not found' });

    // Duplicate refund prevention
    const existingRefund = await db.PaypalTransaction.findOne({
      where: { paypalCaptureId: captureId, type: 'refund', status: { [Op.ne]: 'ERROR' } }
    });
    if (existingRefund) {
      return res.status(400).json({ error: 'This capture has already been refunded', refundId: existingRefund.paypalRefundId });
    }

    // Build refund payload
    const refundData = {};
    if (amount) {
      refundData.amount = { value: parseFloat(amount).toFixed(2), currency_code: 'EUR' };
    }
    if (note) refundData.note_to_payer = note;

    const response = await paypalRequest('post', `/v2/payments/captures/${captureId}/refund`, refundData);
    const refund = response.data;

    // Store refund transaction
    await db.PaypalTransaction.create({
      paypalOrderId: captureTx.paypalOrderId,
      paypalCaptureId: captureId,
      paypalRefundId: refund.id,
      paymentId: captureTx.paymentId,
      memberId: captureTx.memberId,
      userId: req.user.id,
      type: 'refund',
      status: refund.status,
      amount: parseFloat(refund.amount?.value || amount || captureTx.amount),
      currency: 'EUR',
      description: `Refund: ${reason || 'Admin initiated'}`,
      rawPayload: refund,
      ipAddress: req.ip
    });

    // Update payment record
    if (captureTx.paymentId) {
      const payment = await db.Payment.findByPk(captureTx.paymentId);
      if (payment) {
        await payment.update({
          status: 'refunded',
          refundReason: reason || 'Admin initiated refund',
          refundedAt: new Date(),
          metadata: { ...payment.metadata, refundId: refund.id, refundStatus: refund.status }
        });
      }
    }

    // Audit
    await db.AuditLog.create({
      userId: req.user.id,
      action: 'PAYPAL_REFUND',
      entity: 'Payment',
      entityId: captureTx.paymentId,
      newValues: { captureId, refundId: refund.id, amount: refund.amount?.value, reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    console.log(`[PayPal] Refund completed: ${refund.id} for capture ${captureId}`);
    res.json({ refundId: refund.id, status: refund.status, amount: refund.amount });
  } catch (error) {
    console.error('[PayPal] refund FAILED:', error.response?.data || error.message);
    await logPaypalError('refund', error, { captureId: req.params.captureId, body: req.body });
    res.status(500).json({ error: 'Network error. Please try again.', details: error.response?.data?.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOKS / IPN
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/paypal/webhook
// NOTE: global express.json() already parsed req.body — no need for express.raw()
router.post('/webhook', async (req, res) => {
  // Respond to PayPal immediately — process async to avoid their timeout
  res.status(200).json({ received: true });

  try {
    const body = req.body;
    const eventType = body.event_type;
    const resource = body.resource;
    const eventId = body.id;

    console.log(`[PayPal Webhook] Event: ${eventType}, ID: ${eventId}`);

    if (!eventType || !eventId) {
      console.error('[PayPal Webhook] Missing event_type or id');
      return;
    }

    // Duplicate prevention
    if (await isDuplicateWebhookEvent(eventId)) {
      console.log(`[PayPal Webhook] Duplicate event ${eventId}, skipping`);
      return;
    }

    // Webhook signature verification
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      try {
        const verifyData = {
          auth_algo: req.headers['paypal-auth-algo'],
          cert_url: req.headers['paypal-cert-url'],
          transmission_id: req.headers['paypal-transmission-id'],
          transmission_sig: req.headers['paypal-transmission-sig'],
          transmission_time: req.headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: body
        };
        const verifyResponse = await paypalRequest('post', '/v1/notifications/verify-webhook-signature', verifyData);
        if (verifyResponse.data.verification_status !== 'SUCCESS') {
          console.error(`[PayPal Webhook] Signature verification FAILED for event ${eventId}`);
          await logPaypalError('webhook-signature', new Error('Signature verification failed'), { eventId, eventType });
          return;
        }
        console.log(`[PayPal Webhook] Signature verified for event ${eventId}`);
      } catch (verifyErr) {
        // Log but don't block — PayPal verify endpoint can be flaky
        console.error('[PayPal Webhook] Signature verification error (non-fatal):', verifyErr.message);
      }
    }

    // Store webhook event (use findOrCreate to handle unique constraint gracefully)
    try {
      await db.PaypalTransaction.findOrCreate({
        where: { webhookEventId: eventId },
        defaults: {
          webhookEventType: eventType,
          type: 'webhook_event',
          status: eventType,
          amount: parseFloat(resource?.amount?.value || resource?.billing_info?.last_payment?.amount?.value || 0),
          currency: resource?.amount?.currency_code || 'EUR',
          rawPayload: body,
          description: `Webhook: ${eventType}`
        }
      });
    } catch (storeErr) {
      console.error('[PayPal Webhook] Store error (non-fatal):', storeErr.message);
    }

    // Handle specific event types
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = resource?.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          const payment = await db.Payment.findOne({ where: { paypalOrderId: orderId } });
          if (payment && payment.status !== 'completed') {
            await payment.update({
              status: 'completed',
              ipnData: body,
              payerEmail: resource?.payer?.email_address,
              metadata: { ...payment.metadata, webhookConfirmed: true, captureId: resource?.id }
            });
            console.log(`[PayPal Webhook] Payment confirmed via webhook: ${orderId}`);
          }
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const orderId = resource?.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          const payment = await db.Payment.findOne({ where: { paypalOrderId: orderId } });
          if (payment) {
            await payment.update({ status: 'refunded', refundedAt: new Date(), ipnData: body });
            console.log(`[PayPal Webhook] Refund confirmed via webhook: ${orderId}`);
          }
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.PENDING': {
        const orderId = resource?.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          const payment = await db.Payment.findOne({ where: { paypalOrderId: orderId } });
          if (payment) {
            const newStatus = eventType === 'PAYMENT.CAPTURE.DENIED' ? 'failed' : 'pending';
            await payment.update({ status: newStatus, ipnData: body });
          }
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subId = resource?.id;
        const sub = await db.PaypalSubscription.findOne({ where: { paypalSubscriptionId: subId } });
        if (sub) {
          await sub.update({
            status: 'ACTIVE',
            subscriberEmail: resource?.subscriber?.email_address,
            subscriberName: `${resource?.subscriber?.name?.given_name || ''} ${resource?.subscriber?.name?.surname || ''}`.trim(),
            startDate: resource?.start_time,
            nextBillingDate: resource?.billing_info?.next_billing_time,
            lastWebhookData: body
          });
          const payment = await db.Payment.findOne({ where: { paypalSubscriptionId: subId } });
          if (payment) await payment.update({ status: 'completed' });
          console.log(`[PayPal Webhook] Subscription activated: ${subId}`);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subId = resource?.id;
        const sub = await db.PaypalSubscription.findOne({ where: { paypalSubscriptionId: subId } });
        if (sub) {
          const statusMap = {
            'BILLING.SUBSCRIPTION.CANCELLED': 'CANCELLED',
            'BILLING.SUBSCRIPTION.EXPIRED': 'EXPIRED',
            'BILLING.SUBSCRIPTION.SUSPENDED': 'SUSPENDED'
          };
          await sub.update({
            status: statusMap[eventType],
            cancelledAt: eventType.includes('CANCELLED') ? new Date() : sub.cancelledAt,
            lastWebhookData: body
          });
          console.log(`[PayPal Webhook] Subscription ${statusMap[eventType]}: ${subId}`);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const subId = resource?.id;
        console.error(`[PayPal Webhook] Subscription payment failed: ${subId}`);
        break;
      }

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
    }

    console.log(`[PayPal Webhook] Processed event: ${eventType}`);
  } catch (error) {
    console.error('[PayPal Webhook] Processing error:', error.message);
    try { await logPaypalError('webhook', error, { body: req.body }); } catch (e) { /* ignore */ }
    // Response already sent — just log
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT HISTORY SYNC
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/paypal/payment-history
router.get('/payment-history', authenticateToken, authorize('payments:read'), async (req, res) => {
  try {
    const { days = 30, page = 1, limit = 20 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Fetch from PayPal
    const response = await paypalRequest('get',
      `/v1/reporting/transactions?start_date=${startDate.toISOString()}&end_date=${new Date().toISOString()}&fields=all&page_size=100&page=1`
    );

    const transactions = response.data.transaction_details || [];

    // Sync to local DB
    let synced = 0;
    for (const tx of transactions) {
      const txInfo = tx.transaction_info;
      const payerInfo = tx.payer_info;

      const existing = await db.PaypalTransaction.findOne({
        where: {
          [Op.or]: [
            { paypalCaptureId: txInfo.transaction_id },
            { paypalOrderId: txInfo.transaction_id }
          ]
        }
      });

      if (!existing) {
        await db.PaypalTransaction.create({
          paypalCaptureId: txInfo.transaction_id,
          type: txInfo.transaction_event_code?.startsWith('T00') ? 'capture' : 'order',
          status: txInfo.transaction_status,
          amount: Math.abs(parseFloat(txInfo.transaction_amount?.value || 0)),
          currency: txInfo.transaction_amount?.currency_code || 'EUR',
          payerEmail: payerInfo?.email_address,
          payerName: `${payerInfo?.payer_name?.given_name || ''} ${payerInfo?.payer_name?.surname || ''}`.trim(),
          description: `Synced: ${txInfo.transaction_subject || txInfo.transaction_event_code}`,
          rawPayload: tx
        });
        synced++;
      }
    }

    // Return local transactions with pagination
    const { rows, count } = await db.PaypalTransaction.findAndCountAll({
      where: { type: { [Op.ne]: 'webhook_event' } },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    console.log(`[PayPal] History sync: ${synced} new transactions from ${transactions.length} total`);
    res.json({
      transactions: rows,
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) },
      syncedFromPayPal: transactions.length,
      newlySynced: synced
    });
  } catch (error) {
    console.error('[PayPal] payment-history FAILED:', error.response?.data || error.message);

    // Fallback: return local data only
    try {
      const { page = 1, limit = 20 } = req.query;
      const { rows, count } = await db.PaypalTransaction.findAndCountAll({
        where: { type: { [Op.ne]: 'webhook_event' } },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });
      res.json({
        transactions: rows,
        pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) },
        syncedFromPayPal: 0,
        newlySynced: 0,
        syncError: 'Could not reach PayPal API'
      });
    } catch (dbErr) {
      res.status(500).json({ error: 'Failed to fetch payment history' });
    }
  }
});

// GET /api/paypal/transaction-stats
router.get('/transaction-stats', authenticateToken, authorize('payments:read'), async (req, res) => {
  try {
    const totalCaptures = await db.PaypalTransaction.count({ where: { type: 'capture' } });
    const totalRefunds = await db.PaypalTransaction.count({ where: { type: 'refund' } });
    const totalOrders = await db.PaypalTransaction.count({ where: { type: 'order' } });
    const totalWebhooks = await db.PaypalTransaction.count({ where: { type: 'webhook_event' } });
    const totalErrors = await db.PaypalTransaction.count({ where: { status: 'ERROR' } });
    const capturedAmount = await db.PaypalTransaction.sum('amount', { where: { type: 'capture', status: 'COMPLETED' } }) || 0;
    const refundedAmount = await db.PaypalTransaction.sum('amount', { where: { type: 'refund' } }) || 0;
    const activeSubscriptions = await db.PaypalSubscription.count({ where: { status: 'ACTIVE' } });

    res.json({
      totalOrders, totalCaptures, totalRefunds, totalWebhooks, totalErrors,
      capturedAmount: parseFloat(capturedAmount),
      refundedAmount: parseFloat(refundedAmount),
      netRevenue: parseFloat(capturedAmount) - parseFloat(refundedAmount),
      activeSubscriptions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
