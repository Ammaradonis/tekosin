import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiDollarSign, FiRefreshCw, FiDownload, FiFilter, FiPlus, FiChevronLeft, FiChevronRight, FiClock, FiZap, FiActivity, FiRepeat, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

// ─── Detect visitor country via IP (cached) ─────────────────────────────────
let detectedCountry = null;
const detectCountry = async () => {
  if (detectedCountry) return detectedCountry;
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    detectedCountry = {
      countryCode: data.country_code || 'AT',
      phoneCode: data.country_calling_code || '+43'
    };
  } catch {
    detectedCountry = { countryCode: 'AT', phoneCode: '+43' };
  }
  return detectedCountry;
};

// ─── PayPal Buttons + Inline Card Fields Component ──────────────────────────
const PayPalButtonWrapper = ({ amount, description, onSuccess, onError }) => {
  const buttonsRef = useRef(null);
  const cardContainerRef = useRef(null);
  const renderedRef = useRef(false);
  const [cardFieldsInstance, setCardFieldsInstance] = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [visitorCountry, setVisitorCountry] = useState(null);

  // Detect country on mount
  useEffect(() => {
    detectCountry().then(setVisitorCountry);
  }, []);

  // Shared createOrder function
  const createOrder = async () => {
    const res = await api.post('/paypal/create-order', {
      amount: parseFloat(amount).toFixed(2),
      description: description || 'TÊKOȘÎN Donation'
    });
    return res.data.orderId;
  };

  // Shared onApprove function
  const onApprove = async (data) => {
    try {
      const res = await api.post('/paypal/capture-order', { orderId: data.orderID });
      onSuccess && onSuccess(res.data);
    } catch (err) {
      console.error('[PayPal] capture error:', err);
      onError && onError(err.response?.data?.error || 'Network error. Please try again.');
    }
  };

  // Render PayPal wallet buttons
  useEffect(() => {
    if (!window.paypal_sdk || !buttonsRef.current || renderedRef.current) return;
    if (!amount || parseFloat(amount) < 0.01) return;

    renderedRef.current = true;
    buttonsRef.current.innerHTML = '';

    window.paypal_sdk.Buttons({
      style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'donate', height: 45 },
      createOrder,
      onApprove,
      onCancel: () => { toast('Payment cancelled', { icon: '⚠️' }); },
      onError: (err) => {
        console.error('[PayPal] Button error:', err);
        onError && onError('PayPal encountered an error. Please try again.');
      }
    }).render(buttonsRef.current).catch(err => {
      console.error('[PayPal] Render error:', err);
    });

    return () => { renderedRef.current = false; };
  }, [amount, description, onSuccess, onError]);

  // Initialize CardFields when user clicks "Debit or Credit Card"
  useEffect(() => {
    if (!showCardForm || !window.paypal_sdk?.CardFields || !cardContainerRef.current) return;
    if (cardFieldsInstance) return;

    try {
      const fields = window.paypal_sdk.CardFields({
        createOrder,
        onApprove,
        onError: (err) => {
          console.error('[PayPal CardFields] error:', err);
          setCardSubmitting(false);
          onError && onError('Card payment failed. Please try again.');
        },
        style: {
          input: {
            'font-size': '16px',
            'font-family': 'system-ui, -apple-system, sans-serif',
            color: '#ffffff',
            'background-color': '#1a1a2e'
          },
          '.invalid': { color: '#ef4444' }
        }
      });

      if (fields.isEligible()) {
        fields.NameField({ placeholder: 'Cardholder name' }).render(cardContainerRef.current);
        fields.NumberField({ placeholder: 'Card number' }).render(cardContainerRef.current);
        fields.ExpiryField({ placeholder: 'MM / YY' }).render(cardContainerRef.current);
        fields.CVVField({ placeholder: 'CSC' }).render(cardContainerRef.current);
        setCardFieldsInstance(fields);
      } else {
        console.warn('[PayPal] CardFields not eligible for this merchant');
        onError && onError('Card payments are not available. Please use PayPal.');
      }
    } catch (err) {
      console.error('[PayPal CardFields] init error:', err);
    }
  }, [showCardForm, amount, description]);

  const handleCardSubmit = async () => {
    if (!cardFieldsInstance || cardSubmitting) return;
    setCardSubmitting(true);
    try {
      await cardFieldsInstance.submit({
        billingAddress: {
          countryCode: visitorCountry?.countryCode || 'AT'
        }
      });
    } catch (err) {
      console.error('[PayPal CardFields] submit error:', err);
      onError && onError(err.message || 'Card payment failed.');
    } finally {
      setCardSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* PayPal wallet buttons */}
      <div ref={buttonsRef} className="min-h-[50px]" />

      {/* Debit/Credit Card toggle */}
      {!showCardForm ? (
        <button
          type="button"
          onClick={() => setShowCardForm(true)}
          className="w-full py-3 rounded-xl font-bold text-sm bg-tekosin-card border border-tekosin-border hover:border-neon-cyan/40 transition-all flex items-center justify-center gap-2 text-gray-300"
        >
          💳 Debit or Credit Card
        </button>
      ) : (
        <div className="border border-tekosin-border rounded-xl p-4 space-y-3 bg-tekosin-card/50">
          <p className="text-xs font-bold text-neon-cyan text-center">💳 Debit or Credit Card</p>
          <div ref={cardContainerRef} className="space-y-2 [&>div]:rounded-lg [&>div]:border [&>div]:border-tekosin-border [&>div]:overflow-hidden [&>div]:min-h-[45px]" />
          {visitorCountry && (
            <p className="text-xs text-gray-500 text-center">
              Billing country: {visitorCountry.countryCode} • Phone: {visitorCountry.phoneCode}
            </p>
          )}
          <button
            type="button"
            onClick={handleCardSubmit}
            disabled={cardSubmitting || !cardFieldsInstance}
            className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cardSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              `Pay €${parseFloat(amount || 0).toFixed(2)}`
            )}
          </button>
          <button
            type="button"
            onClick={() => { setShowCardForm(false); setCardFieldsInstance(null); }}
            className="w-full text-xs text-gray-500 hover:text-gray-300 transition-all"
          >
            ← Back to PayPal
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Success Modal ───────────────────────────────────────────────────────────
const SuccessModal = ({ data, onClose }) => {
  const [countdown, setCountdown] = useState(10);
  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => { if (c <= 1) { onClose(); return 0; } return c - 1; }), 1000);
    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
      <div className="glass-card p-8 w-full max-w-md animate-bounce-in text-center my-auto">
        <div className="text-6xl mb-4 animate-explosion">🎉</div>
        <h2 className="text-2xl font-black neon-text mb-2">PAYMENT SUCCESSFUL!</h2>
        <p className="text-neon-green font-bold text-xl mb-1">€{Number(data?.amount || 0).toFixed(2)} EUR</p>
        <p className="text-sm text-gray-400 mb-1">Capture ID: <span className="text-neon-cyan font-mono text-xs">{data?.captureId || '—'}</span></p>
        {data?.payer?.email_address && <p className="text-sm text-gray-400 mb-4">Payer: {data.payer.email_address}</p>}
        <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/30 mb-4">
          <p className="text-neon-green font-bold text-sm">✅ Server-side capture confirmed</p>
          <p className="text-xs text-gray-400">Transaction logged & audited</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">Auto-closing in {countdown}s</p>
        <button onClick={onClose} className="neon-button w-full">Close</button>
      </div>
    </div>
  );
};

// ─── Main PaymentsPage ───────────────────────────────────────────────────────
const PaymentsPage = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [paypalStats, setPaypalStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState('payments');

  // Donate modal
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateAmount, setDonateAmount] = useState('10');
  const [donateDesc, setDonateDesc] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Manual modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({ amount: '', description: '', type: 'one_time' });

  // Refund modal
  const [showRefundModal, setShowRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundNote, setRefundNote] = useState('');

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState([]);

  // PayPal history
  const [paypalHistory, setPaypalHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);

  useEffect(() => { loadPayments(); loadStats(); loadPaypalStats(); }, [page, statusFilter, typeFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments', { params: { page, limit: 20, status: statusFilter, type: typeFilter } });
      setPayments(res.data.payments);
      setPagination(res.data.pagination);
    } catch (e) { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  const loadStats = async () => {
    try { const res = await api.get('/payments/stats'); setStats(res.data); } catch (e) { /* ignore */ }
  };

  const loadPaypalStats = async () => {
    try { const res = await api.get('/paypal/transaction-stats'); setPaypalStats(res.data); } catch (e) { /* ignore */ }
  };

  const loadSubscriptions = async () => {
    try { const res = await api.get('/paypal/subscriptions'); setSubscriptions(res.data.subscriptions || []); } catch (e) { /* ignore */ }
  };

  const loadPaypalHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/paypal/payment-history', { params: { days: 30 } });
      setPaypalHistory(res.data.transactions || []);
      setSyncInfo({ synced: res.data.newlySynced, total: res.data.syncedFromPayPal, error: res.data.syncError });
    } catch (e) { toast.error('Failed to sync PayPal history'); }
    finally { setHistoryLoading(false); }
  };

  const handlePaypalSuccess = useCallback((data) => {
    setSuccessData(data);
    setShowDonateModal(false);
    setDonateAmount('10');
    setDonateDesc('');
    loadPayments();
    loadStats();
    loadPaypalStats();
    toast.success(`Payment captured! €${Number(data?.amount || 0).toFixed(2)}`);
  }, []);

  const handlePaypalError = useCallback((msg) => {
    toast.error(msg || 'Network error. Please try again.');
  }, []);

  const handleManualPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments/manual', manualData);
      toast.success('Manual payment recorded');
      setShowManualModal(false);
      setManualData({ amount: '', description: '', type: 'one_time' });
      loadPayments();
      loadStats();
    } catch (e) { toast.error('Failed to record payment'); }
  };

  const handleRefund = async () => {
    if (!showRefundModal) return;
    const payment = showRefundModal;
    const captureId = payment.metadata?.captureId;

    try {
      if (captureId) {
        await api.post(`/paypal/refund/${captureId}`, { reason: refundReason || 'Admin initiated', note: refundNote });
      } else {
        await api.post(`/payments/${payment.id}/refund`, { reason: refundReason || 'Admin initiated refund' });
      }
      toast.success('Payment refunded via PayPal');
      setShowRefundModal(null);
      setRefundReason('');
      setRefundNote('');
      loadPayments();
      loadStats();
      loadPaypalStats();
    } catch (e) { toast.error(e.response?.data?.error || 'Refund failed'); }
  };

  const handleCancelSubscription = async (subId) => {
    if (!window.confirm('Cancel this subscription?')) return;
    try {
      await api.post('/paypal/cancel-subscription', { subscriptionId: subId, reason: 'Admin cancelled' });
      toast.success('Subscription cancelled');
      loadSubscriptions();
    } catch (e) { toast.error('Failed to cancel subscription'); }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/exports/payments/csv', { params: { status: statusFilter }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported!');
    } catch (e) { toast.error('Export failed'); }
  };

  const statusColors = {
    completed: 'bg-neon-green/20 text-neon-green',
    pending: 'bg-neon-yellow/20 text-neon-yellow',
    failed: 'bg-neon-red/20 text-neon-red',
    refunded: 'bg-purple-500/20 text-purple-400',
    cancelled: 'bg-gray-500/20 text-gray-400'
  };

  const tabs = [
    { id: 'payments', label: 'Payments', icon: FiDollarSign },
    { id: 'subscriptions', label: 'Subscriptions', icon: FiRepeat },
    { id: 'history', label: 'PayPal History', icon: FiActivity },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiDollarSign className="animate-pulse" /> {t('payments.title')}</h1>
          <p className="text-sm text-gray-400">{pagination?.total || 0} total payments • Live PayPal Integration</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowDonateModal(true)} className="neon-button text-sm flex items-center gap-2 animate-pulse-neon">
            <FiZap /> PayPal {t('payments.donate')}
          </button>
          <button onClick={() => setShowManualModal(true)} className="neon-button-cyan text-sm flex items-center gap-2 px-4 py-2 rounded-xl font-bold">
            <FiPlus /> Manual Payment
          </button>
          <button onClick={handleExportCSV} className="neon-button-green text-sm flex items-center gap-2 px-4 py-2 rounded-xl font-bold">
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats && <>
          <div className="stat-card">
            <p className="text-xs text-gray-400">Total Revenue</p>
            <p className="text-xl font-black text-neon-green">€{Number(stats.totalRevenue || 0).toLocaleString('de-AT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-400">Monthly Revenue</p>
            <p className="text-xl font-black text-neon-cyan">€{Number(stats.monthlyRevenue || 0).toLocaleString('de-AT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-400">Completed</p>
            <p className="text-xl font-black text-neon-green">{stats.completedPayments}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-xl font-black text-neon-yellow">{stats.pendingPayments}</p>
          </div>
        </>}
        {paypalStats && (
          <div className="stat-card border-neon-pink/30">
            <p className="text-xs text-neon-pink font-bold">PayPal Live</p>
            <p className="text-xl font-black text-neon-pink">{paypalStats.totalCaptures} captures</p>
            <p className="text-xs text-gray-400">{paypalStats.activeSubscriptions} active subs</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'subscriptions') loadSubscriptions(); if (tab.id === 'history') loadPaypalHistory(); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' : 'text-gray-400 hover:bg-tekosin-card'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: Payments ═══ */}
      {activeTab === 'payments' && (
        <>
          {/* Filters */}
          <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
            <FiFilter className="text-neon-cyan" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="neon-input w-auto">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="neon-input w-auto">
              <option value="">All Types</option>
              <option value="one_time">One-time</option>
              <option value="recurring">Recurring</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-tekosin-border">
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Member</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('payments.amount')}</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('payments.type')}</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('payments.status')}</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">PayPal ID</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Date</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-8 text-center"><div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500">{t('common.noData')}</td></tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id} className="table-row border-b border-tekosin-border/50">
                        <td className="p-3 text-sm">{p.Member ? `${p.Member.firstName} ${p.Member.lastName}` : p.payerName || 'Anonymous'}</td>
                        <td className="p-3 text-sm font-bold text-neon-green">€{Number(p.amount).toFixed(2)}</td>
                        <td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-tekosin-card">{p.type}</span></td>
                        <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[p.status] || ''}`}>{p.status}</span></td>
                        <td className="p-3 text-xs font-mono text-gray-500 max-w-[120px] truncate">{p.paypalOrderId || p.paypalSubscriptionId || '—'}</td>
                        <td className="p-3 text-sm text-gray-400">{new Date(p.createdAt).toLocaleDateString('de-AT')}</td>
                        <td className="p-3">
                          {p.status === 'completed' && (
                            <button onClick={() => { setShowRefundModal(p); setRefundReason(''); setRefundNote(''); }}
                              className="px-2 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center gap-1">
                              <FiRefreshCw size={12} /> Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-tekosin-border">
                <p className="text-sm text-gray-400">Page {pagination.page} of {pagination.pages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-tekosin-card disabled:opacity-30"><FiChevronLeft /></button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-2 rounded-lg hover:bg-tekosin-card disabled:opacity-30"><FiChevronRight /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ TAB: Subscriptions ═══ */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <h3 className="font-bold text-neon-cyan mb-3 flex items-center gap-2"><FiRepeat /> Active Subscriptions</h3>
            {subscriptions.length === 0 ? (
              <p className="text-gray-500 text-sm">No subscriptions found. Create a billing plan first.</p>
            ) : (
              <div className="space-y-3">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="p-4 rounded-xl border border-tekosin-border hover:border-neon-cyan/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{sub.subscriberName || sub.subscriberEmail || 'Unknown'}</p>
                        <p className="text-xs text-gray-400 font-mono">{sub.paypalSubscriptionId}</p>
                        <p className="text-xs text-gray-400">Plan: {sub.paypalPlanId} • {sub.frequency}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sub.status === 'ACTIVE' ? 'bg-neon-green/20 text-neon-green' : sub.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' : 'bg-neon-yellow/20 text-neon-yellow'}`}>
                          {sub.status}
                        </span>
                        {sub.amount > 0 && <p className="text-sm font-bold text-neon-green mt-1">€{Number(sub.amount).toFixed(2)}/{sub.frequency === 'MONTHLY' ? 'mo' : 'yr'}</p>}
                        {sub.status === 'ACTIVE' && (
                          <button onClick={() => handleCancelSubscription(sub.paypalSubscriptionId)} className="text-xs text-red-400 hover:underline mt-1">Cancel</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: PayPal History ═══ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-neon-cyan flex items-center gap-2"><FiActivity /> PayPal Transaction History</h3>
            <button onClick={loadPaypalHistory} disabled={historyLoading} className="neon-button-cyan text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1">
              <FiRefreshCw className={historyLoading ? 'animate-spin' : ''} size={14} /> Sync Now
            </button>
          </div>
          {syncInfo && (
            <div className={`p-3 rounded-lg text-sm ${syncInfo.error ? 'bg-neon-yellow/10 border border-neon-yellow/30' : 'bg-neon-green/10 border border-neon-green/30'}`}>
              {syncInfo.error ? (
                <p className="text-neon-yellow flex items-center gap-1"><FiAlertTriangle /> {syncInfo.error} — showing local data only</p>
              ) : (
                <p className="text-neon-green flex items-center gap-1"><FiCheckCircle /> Synced {syncInfo.synced} new transactions from {syncInfo.total} PayPal records</p>
              )}
            </div>
          )}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-tekosin-border">
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Type</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Amount</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Status</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Payer</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">PayPal ID</th>
                    <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center"><div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                  ) : paypalHistory.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No PayPal transactions yet</td></tr>
                  ) : (
                    paypalHistory.map(tx => (
                      <tr key={tx.id} className="table-row border-b border-tekosin-border/50">
                        <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded font-bold ${tx.type === 'capture' ? 'bg-neon-green/20 text-neon-green' : tx.type === 'refund' ? 'bg-red-500/20 text-red-400' : 'bg-tekosin-card text-gray-300'}`}>{tx.type}</span></td>
                        <td className="p-3 text-sm font-bold text-neon-green">€{Number(tx.amount || 0).toFixed(2)}</td>
                        <td className="p-3 text-xs font-mono text-gray-400">{tx.status}</td>
                        <td className="p-3 text-sm text-gray-400">{tx.payerEmail || tx.payerName || '—'}</td>
                        <td className="p-3 text-xs font-mono text-gray-500 max-w-[100px] truncate">{tx.paypalCaptureId || tx.paypalOrderId || '—'}</td>
                        <td className="p-3 text-sm text-gray-400">{new Date(tx.createdAt).toLocaleString('de-AT')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DONATE MODAL with PayPal Popup ═══ */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
          <div className="glass-card p-6 w-full max-w-md animate-bounce-in my-auto">
            <h2 className="text-xl font-black neon-text mb-1 flex items-center gap-2"><FiZap className="animate-pulse" /> PayPal {t('payments.donate')}</h2>
            <p className="text-xs text-neon-red font-bold animate-pulse mb-4">🚨 {t('crisis.urgent')} — EVERY EURO SAVES LIVES!</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neon-cyan mb-1">{t('payments.amount')} (EUR)</label>
                <input type="number" step="0.01" min="0.01" value={donateAmount}
                  onChange={(e) => setDonateAmount(e.target.value)}
                  className="neon-input text-2xl font-black text-center" placeholder="10.00" />
              </div>
              <div className="flex gap-2 justify-center">
                {[5, 10, 25, 50, 100, 250].map(amt => (
                  <button key={amt} type="button" onClick={() => setDonateAmount(amt.toString())}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${parseFloat(donateAmount) === amt ? 'bg-neon-pink/30 text-neon-pink border border-neon-pink/50' : 'bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20'}`}>
                    €{amt}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-bold text-neon-cyan mb-1">Description (optional)</label>
                <input value={donateDesc} onChange={(e) => setDonateDesc(e.target.value)} className="neon-input" placeholder="TÊKOȘÎN Donation" />
              </div>

              {/* PayPal Buttons */}
              <div className="border-t border-tekosin-border pt-4">
                <p className="text-xs text-gray-400 mb-2 text-center">Secure payment via PayPal — server-side capture</p>
                {parseFloat(donateAmount) >= 0.01 ? (
                  <PayPalButtonWrapper
                    key={`${donateAmount}-${donateDesc}`}
                    amount={donateAmount}
                    description={donateDesc}
                    onSuccess={handlePaypalSuccess}
                    onError={handlePaypalError}
                  />
                ) : (
                  <p className="text-center text-neon-yellow text-sm">Enter an amount to enable PayPal</p>
                )}
              </div>

              <button type="button" onClick={() => setShowDonateModal(false)} className="w-full px-6 py-2 rounded-xl border border-tekosin-border text-gray-400 hover:bg-tekosin-card transition-all">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REFUND MODAL ═══ */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
          <div className="glass-card p-6 w-full max-w-md animate-bounce-in my-auto">
            <h2 className="text-xl font-black text-red-400 mb-2 flex items-center gap-2"><FiXCircle /> Refund Payment</h2>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
              <p className="text-sm font-bold text-red-400">€{Number(showRefundModal.amount).toFixed(2)} EUR</p>
              <p className="text-xs text-gray-400">Order: {showRefundModal.paypalOrderId || '—'}</p>
              {showRefundModal.metadata?.captureId && <p className="text-xs text-gray-400">Capture: {showRefundModal.metadata.captureId}</p>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Reason</label>
                <select value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="neon-input">
                  <option value="">Select reason...</option>
                  <option value="duplicate">Duplicate payment</option>
                  <option value="requested_by_customer">Requested by member</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="admin_initiated">Admin initiated</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Note to payer (optional)</label>
                <input value={refundNote} onChange={(e) => setRefundNote(e.target.value)} className="neon-input" placeholder="Refund note..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleRefund} className="flex-1 px-4 py-2 rounded-xl font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all">
                  Confirm Refund
                </button>
                <button onClick={() => setShowRefundModal(null)} className="px-6 py-2 rounded-xl border border-tekosin-border text-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MANUAL PAYMENT MODAL ═══ */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
          <div className="glass-card p-6 w-full max-w-md animate-bounce-in my-auto">
            <h2 className="text-xl font-black neon-text-cyan mb-4">Record Manual Payment</h2>
            <form onSubmit={handleManualPayment} className="space-y-4">
              <input type="number" step="0.01" min="0.01" value={manualData.amount} onChange={(e) => setManualData({ ...manualData, amount: e.target.value })} className="neon-input" placeholder="Amount (EUR)" required />
              <input value={manualData.description} onChange={(e) => setManualData({ ...manualData, description: e.target.value })} className="neon-input" placeholder="Description" />
              <select value={manualData.type} onChange={(e) => setManualData({ ...manualData, type: e.target.value })} className="neon-input">
                <option value="one_time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
              <div className="flex gap-3">
                <button type="submit" className="neon-button-cyan flex-1 px-4 py-2 rounded-xl font-bold">Record Payment</button>
                <button type="button" onClick={() => setShowManualModal(false)} className="px-6 py-2 rounded-xl border border-tekosin-border">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ SUCCESS MODAL ═══ */}
      {successData && <SuccessModal data={successData} onClose={() => setSuccessData(null)} />}
    </div>
  );
};

export default PaymentsPage;
