import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchDashboard } from '../store/dashboardSlice';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { FiUsers, FiDollarSign, FiCalendar, FiHeart, FiTrendingUp, FiAlertTriangle, FiClock, FiActivity } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CountdownTimer = ({ expiresAt, title, description }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = new Date(expiresAt) - now;
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="countdown-timer animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <FiAlertTriangle className="text-neon-red animate-shake" size={18} />
        <h4 className="font-black text-neon-red text-sm">{title}</h4>
      </div>
      <p className="text-xs text-gray-400 mb-3">{description}</p>
      <div className="flex gap-3">
        {[
          { val: timeLeft.d, label: 'D' },
          { val: timeLeft.h, label: 'H' },
          { val: timeLeft.m, label: 'M' },
          { val: timeLeft.s, label: 'S' }
        ].map((item, i) => (
          <div key={i} className="text-center">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <span className="text-lg font-black text-neon-red">{item.val || 0}</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-neon-orange mt-2 font-bold animate-pulse">
        ⏰ {t('crisis.timeRunning')}: {timeLeft.d} {t('crisis.daysLeft')}
      </p>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className="stat-card group">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-xs text-neon-green font-bold">
          <FiTrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-black">{value ?? '—'}</p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

const DashboardPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { stats, charts, recentActivity, crisisEvents, loading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const memberGrowthData = {
    labels: charts?.memberGrowth?.map(m => new Date(m.month).toLocaleDateString('de-AT', { month: 'short' })) || [],
    datasets: [{
      label: t('dashboard.totalMembers'),
      data: charts?.memberGrowth?.map(m => parseInt(m.count)) || [],
      borderColor: '#ff00ff',
      backgroundColor: 'rgba(255, 0, 255, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#ff00ff',
      pointBorderColor: '#00ffff',
      pointBorderWidth: 2
    }]
  };

  const paymentTrendData = {
    labels: charts?.paymentTrend?.map(p => new Date(p.month).toLocaleDateString('de-AT', { month: 'short' })) || [],
    datasets: [{
      label: '€ Revenue',
      data: charts?.paymentTrend?.map(p => parseFloat(p.total)) || [],
      backgroundColor: 'rgba(0, 255, 255, 0.6)',
      borderColor: '#00ffff',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  const nationalityData = {
    labels: charts?.nationalityDist?.map(n => n.nationality || 'Unknown') || [],
    datasets: [{
      data: charts?.nationalityDist?.map(n => parseInt(n.count)) || [],
      backgroundColor: ['#ff00ff', '#00ffff', '#39ff14', '#ffff00', '#ff6600', '#bf00ff', '#ff0040', '#0080ff', '#ff8800', '#00ff88'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#a0a0cc', font: { size: 11 } } },
      tooltip: { backgroundColor: '#111128', borderColor: '#ff00ff', borderWidth: 1, titleColor: '#ff00ff', bodyColor: '#e0e0ff' }
    },
    scales: {
      x: { ticks: { color: '#666' }, grid: { color: 'rgba(255,0,255,0.05)' } },
      y: { ticks: { color: '#666' }, grid: { color: 'rgba(0,255,255,0.05)' } }
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-neon-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Crisis Alert Banner */}
      <div className="glass-card p-4 border-neon-red/30 bg-gradient-to-r from-red-500/5 to-orange-500/5">
        <div className="flex items-center gap-3">
          <FiAlertTriangle className="text-neon-red animate-shake" size={24} />
          <div>
            <h3 className="font-black text-neon-red text-lg animate-pulse">{t('crisis.shocking')}</h3>
            <p className="text-xs text-gray-400">TÊKOȘÎN - {t('app.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers} label={t('dashboard.totalMembers')} value={stats?.totalMembers} color="bg-gradient-to-br from-neon-pink to-neon-purple" trend={`+${stats?.newMembersThisWeek || 0} this week`} />
        <StatCard icon={FiUsers} label={t('dashboard.activeMembers')} value={stats?.activeMembers} color="bg-gradient-to-br from-neon-cyan to-neon-blue" />
        <StatCard icon={FiDollarSign} label={t('dashboard.monthlyRevenue')} value={stats?.monthRevenue ? `€${Number(stats.monthRevenue).toLocaleString()}` : '€0'} color="bg-gradient-to-br from-neon-green to-emerald-500" trend="+12%" />
        <StatCard icon={FiCalendar} label={t('dashboard.upcomingEvents')} value={stats?.upcomingEvents} color="bg-gradient-to-br from-neon-orange to-neon-yellow" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={FiUsers} label={t('dashboard.pendingMembers')} value={stats?.pendingMembers} color="bg-gradient-to-br from-yellow-500 to-orange-500" />
        <StatCard icon={FiHeart} label={t('dashboard.volunteers')} value={stats?.totalVolunteers} color="bg-gradient-to-br from-pink-500 to-red-500" />
        <StatCard icon={FiActivity} label={t('nav.notifications')} value={stats?.unreadNotifications} color="bg-gradient-to-br from-indigo-500 to-purple-500" />
      </div>

      {/* Crisis Countdown Timers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(crisisEvents || []).map((event) => (
          <CountdownTimer key={event.id} expiresAt={event.expiresAt} title={event.title} description={event.description} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold text-neon-cyan mb-4 flex items-center gap-2">
            <FiTrendingUp /> Member Growth
          </h3>
          <div className="h-64">
            <Line data={memberGrowthData} options={chartOptions} />
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-bold text-neon-cyan mb-4 flex items-center gap-2">
            <FiDollarSign /> Payment Trend (EUR)
          </h3>
          <div className="h-64">
            <Bar data={paymentTrendData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold text-neon-cyan mb-4">Nationality Distribution</h3>
          <div className="h-64">
            <Doughnut data={nationalityData} options={{ ...chartOptions, scales: undefined, cutout: '60%' }} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-bold text-neon-cyan mb-4 flex items-center gap-2">
            <FiClock /> {t('dashboard.recentActivity')}
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(recentActivity || []).map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-tekosin-card/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-bold text-neon-cyan">{log.User?.firstName} {log.User?.lastName}</span>
                    {' '}<span className="text-gray-400">{log.action}</span>
                    {' '}<span className="text-neon-pink">{log.entity}</span>
                  </p>
                  <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString('de-AT')}</p>
                </div>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-gray-500 text-sm">{t('common.noData')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-neon-cyan mb-4">{t('dashboard.quickActions')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t('members.addNew'), color: 'neon-button', href: '/members' },
            { label: t('payments.donate'), color: 'neon-button-cyan', href: '/payments' },
            { label: t('nav.events'), color: 'neon-button-green', href: '/events' },
            { label: t('nav.reports'), color: 'neon-button', href: '/reports' }
          ].map((action, i) => (
            <a key={i} href={action.href} className={`${action.color} text-center text-sm py-3 rounded-xl font-bold block transition-transform hover:scale-105`}>
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
