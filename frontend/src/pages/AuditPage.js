import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiShield, FiSearch, FiFilter } from 'react-icons/fi';

const AuditPage = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => { loadLogs(); loadStats(); }, [page, actionFilter, entityFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit', { params: { page, limit: 50, action: actionFilter, entity: entityFilter } });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (e) { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  const loadStats = async () => {
    try { const res = await api.get('/audit/stats'); setStats(res.data); } catch (e) { /* ignore */ }
  };

  const actionColors = {
    LOGIN: 'text-neon-green', LOGOUT: 'text-gray-400', CREATE_MEMBER: 'text-neon-cyan',
    UPDATE_MEMBER: 'text-neon-yellow', DELETE_MEMBER: 'text-neon-red', CREATE_PAYMENT: 'text-neon-green',
    EXPORT_DATA: 'text-neon-purple', GDPR_FORGET: 'text-neon-red'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiShield /> {t('nav.audit')}</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card"><p className="text-xs text-gray-400">Total Logs</p><p className="text-2xl font-black text-neon-pink">{stats.totalLogs}</p></div>
          <div className="stat-card"><p className="text-xs text-gray-400">Today</p><p className="text-2xl font-black text-neon-cyan">{stats.todayLogs}</p></div>
          <div className="stat-card"><p className="text-xs text-gray-400">Top Action</p><p className="text-lg font-black text-neon-green">{stats.byAction?.[0]?.action || '—'}</p></div>
          <div className="stat-card"><p className="text-xs text-gray-400">Top Entity</p><p className="text-lg font-black text-neon-yellow">{stats.byEntity?.[0]?.entity || '—'}</p></div>
        </div>
      )}

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <input value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} placeholder="Filter by action..." className="neon-input flex-1" />
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="neon-input w-auto">
          <option value="">All Entities</option>
          <option value="User">User</option><option value="Member">Member</option>
          <option value="Payment">Payment</option><option value="Event">Event</option>
          <option value="Content">Content</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-tekosin-border">
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Time</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">User</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Action</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Entity</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">IP</th>
            </tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="table-row border-b border-tekosin-border/50">
                  <td className="p-3 text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('de-AT')}</td>
                  <td className="p-3 text-sm">{log.User ? `${log.User.firstName} ${log.User.lastName}` : '—'}</td>
                  <td className="p-3 text-sm font-bold"><span className={actionColors[log.action] || 'text-gray-300'}>{log.action}</span></td>
                  <td className="p-3 text-sm text-gray-400">{log.entity || '—'}</td>
                  <td className="p-3 text-xs text-gray-500">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-tekosin-border">
              <p className="text-sm text-gray-400">Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-tekosin-card text-sm disabled:opacity-30">Prev</button>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-3 py-1 rounded-lg bg-tekosin-card text-sm disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditPage;
