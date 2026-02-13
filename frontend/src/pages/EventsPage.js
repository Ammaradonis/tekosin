import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiMapPin, FiClock, FiUsers } from 'react-icons/fi';

const EventsPage = () => {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [newEvent, setNewEvent] = useState({ title: { de: '', en: '' }, type: 'meeting', startDate: '', location: '', maxParticipants: '', isOnline: false });

  useEffect(() => { loadEvents(); }, [typeFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events', { params: { limit: 50, type: typeFilter } });
      setEvents(res.data.events);
    } catch (e) { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', { ...newEvent, title: { de: newEvent.title.de, en: newEvent.title.en, tr: '', ar: '', fa: '', es: '' }, description: { de: '', en: '', tr: '', ar: '', fa: '', es: '' } });
      toast.success('Event created!');
      setShowAddModal(false);
      loadEvents();
    } catch (e) { toast.error('Failed to create event'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await api.delete(`/events/${id}`); toast.success('Event deleted'); loadEvents(); }
    catch (e) { toast.error('Delete failed'); }
  };

  const getTitle = (titleObj) => {
    if (!titleObj) return '—';
    if (typeof titleObj === 'string') return titleObj;
    return titleObj[i18n.language] || titleObj.de || titleObj.en || '—';
  };

  const typeColors = {
    meeting: 'bg-neon-cyan/20 text-neon-cyan', workshop: 'bg-neon-pink/20 text-neon-pink',
    social: 'bg-neon-green/20 text-neon-green', fundraiser: 'bg-neon-yellow/20 text-neon-yellow',
    support_group: 'bg-purple-500/20 text-purple-400', training: 'bg-neon-orange/20 text-neon-orange'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiCalendar /> {t('nav.events')}</h1>
          <p className="text-sm text-gray-400">{events.length} events</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="neon-button text-sm flex items-center gap-2"><FiPlus /> Create Event</button>
      </div>

      <div className="glass-card p-4 flex gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="neon-input w-auto">
          <option value="">All Types</option>
          <option value="meeting">Meeting</option><option value="workshop">Workshop</option>
          <option value="social">Social</option><option value="fundraiser">Fundraiser</option>
          <option value="support_group">Support Group</option><option value="training">Training</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <div key={event.id} className="glass-card p-5 hover:border-neon-cyan/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeColors[event.type] || 'bg-gray-500/20 text-gray-400'}`}>{event.type}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDelete(event.id)} className="p-1 rounded hover:bg-red-500/10 text-red-400"><FiTrash2 size={14} /></button>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2">{getTitle(event.title)}</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2"><FiClock size={14} className="text-neon-cyan" />{new Date(event.startDate).toLocaleString('de-AT')}</div>
                <div className="flex items-center gap-2"><FiMapPin size={14} className="text-neon-pink" />{event.location || 'TBD'}</div>
                {event.maxParticipants && (
                  <div className="flex items-center gap-2"><FiUsers size={14} className="text-neon-green" />{event.currentParticipants}/{event.maxParticipants}</div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${event.status === 'planned' ? 'bg-neon-yellow/20 text-neon-yellow' : event.status === 'completed' ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-cyan/20 text-neon-cyan'}`}>{event.status}</span>
                {event.isOnline && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neon-blue/20 text-neon-blue">Online</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-bounce-in">
            <h2 className="text-xl font-black neon-text mb-4">Create Event</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={newEvent.title.de} onChange={(e) => setNewEvent({ ...newEvent, title: { ...newEvent.title, de: e.target.value } })} placeholder="Title (DE)" className="neon-input" required />
              <input value={newEvent.title.en} onChange={(e) => setNewEvent({ ...newEvent, title: { ...newEvent.title, en: e.target.value } })} placeholder="Title (EN)" className="neon-input" />
              <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })} className="neon-input">
                <option value="meeting">Meeting</option><option value="workshop">Workshop</option>
                <option value="social">Social</option><option value="fundraiser">Fundraiser</option>
                <option value="support_group">Support Group</option><option value="training">Training</option>
              </select>
              <input type="datetime-local" value={newEvent.startDate} onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })} className="neon-input" required />
              <input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Location" className="neon-input" />
              <div className="flex gap-3">
                <button type="submit" className="neon-button flex-1">{t('common.create')}</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 rounded-xl border border-tekosin-border">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
