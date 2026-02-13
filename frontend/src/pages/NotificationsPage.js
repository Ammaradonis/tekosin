import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2 } from 'react-icons/fi';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadNotifications(); }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications', { params: { limit: 50, unread: filter === 'unread' ? 'true' : undefined } });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try { await api.put(`/notifications/${id}/read`); loadNotifications(); }
    catch (e) { toast.error('Failed'); }
  };

  const markAllRead = async () => {
    try { await api.put('/notifications/read-all'); toast.success('All marked as read'); loadNotifications(); }
    catch (e) { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/notifications/${id}`); loadNotifications(); }
    catch (e) { toast.error('Failed'); }
  };

  const typeIcons = { info: '💡', warning: '⚠️', error: '❌', success: '✅', urgent: '🚨' };
  const typeColors = { info: 'border-neon-cyan/30', warning: 'border-neon-yellow/30', error: 'border-neon-red/30', success: 'border-neon-green/30', urgent: 'border-neon-red/50 bg-red-500/5' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiBell /> {t('nav.notifications')}</h1>
          <p className="text-sm text-gray-400">{unreadCount} unread</p>
        </div>
        <button onClick={markAllRead} className="neon-button-cyan text-sm flex items-center gap-2 px-4 py-2 rounded-xl font-bold"><FiCheckCircle /> Mark All Read</button>
      </div>

      <div className="glass-card p-4 flex gap-3">
        <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-lg text-sm font-bold ${filter === '' ? 'bg-neon-pink/20 text-neon-pink' : 'text-gray-400'}`}>All</button>
        <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg text-sm font-bold ${filter === 'unread' ? 'bg-neon-pink/20 text-neon-pink' : 'text-gray-400'}`}>Unread ({unreadCount})</button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin"></div></div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-500">{t('common.noData')}</div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`glass-card p-4 border ${typeColors[n.type] || ''} ${!n.isRead ? 'bg-tekosin-card/80' : 'opacity-70'} transition-all hover:opacity-100`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{typeIcons[n.type] || '📌'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm">{n.title}</h4>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-neon-pink animate-pulse"></span>}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{new Date(n.createdAt).toLocaleString('de-AT')}</p>
                </div>
                <div className="flex gap-1">
                  {!n.isRead && <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg hover:bg-neon-green/10 text-neon-green" title="Mark read"><FiCheck size={14} /></button>}
                  <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400" title="Delete"><FiTrash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
