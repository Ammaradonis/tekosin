import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiMail, FiPlus, FiSend, FiTrash2 } from 'react-icons/fi';

const NewslettersPage = () => {
  const { t } = useTranslation();
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNL, setNewNL] = useState({ subject: { de: '', en: '' }, body: { de: '', en: '' }, template: 'default' });

  useEffect(() => { loadNewsletters(); }, []);

  const loadNewsletters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/newsletters', { params: { limit: 50 } });
      setNewsletters(res.data.newsletters);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const data = {
        subject: { de: newNL.subject.de, en: newNL.subject.en, tr: '', ar: '', fa: '', es: '' },
        body: { de: newNL.body.de, en: newNL.body.en, tr: '', ar: '', fa: '', es: '' },
        template: newNL.template
      };
      await api.post('/newsletters', data);
      toast.success('Newsletter created!');
      setShowAddModal(false);
      loadNewsletters();
    } catch (e) { toast.error('Failed'); }
  };

  const handleSend = async (id) => {
    if (!window.confirm('Send this newsletter to all active members?')) return;
    try {
      const res = await api.post(`/newsletters/${id}/send`);
      toast.success(res.data.message);
      loadNewsletters();
    } catch (e) { toast.error('Send failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/newsletters/${id}`); toast.success('Deleted'); loadNewsletters(); }
    catch (e) { toast.error('Failed'); }
  };

  const getSubject = (subj) => {
    if (!subj) return '—';
    if (typeof subj === 'string') return subj;
    return subj.de || subj.en || '—';
  };

  const statusColors = { draft: 'bg-gray-500/20 text-gray-400', scheduled: 'bg-neon-yellow/20 text-neon-yellow', sent: 'bg-neon-green/20 text-neon-green', cancelled: 'bg-neon-red/20 text-neon-red' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiMail /> {t('nav.newsletters')}</h1>
        <button onClick={() => setShowAddModal(true)} className="neon-button text-sm flex items-center gap-2"><FiPlus /> Create Newsletter</button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-tekosin-border">
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Subject</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Status</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Recipients</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Template</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Date</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {newsletters.map(nl => (
                <tr key={nl.id} className="table-row border-b border-tekosin-border/50">
                  <td className="p-3 text-sm font-medium max-w-[200px] truncate">{getSubject(nl.subject)}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[nl.status] || ''}`}>{nl.status}</span></td>
                  <td className="p-3 text-sm text-gray-400">{nl.recipientCount || 0}</td>
                  <td className="p-3 text-sm text-gray-400">{nl.template || 'default'}</td>
                  <td className="p-3 text-sm text-gray-400">{nl.sentAt ? new Date(nl.sentAt).toLocaleDateString('de-AT') : new Date(nl.createdAt).toLocaleDateString('de-AT')}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {nl.status === 'draft' && <button onClick={() => handleSend(nl.id)} className="p-1.5 rounded-lg hover:bg-neon-green/10 text-neon-green" title="Send"><FiSend size={14} /></button>}
                      <button onClick={() => handleDelete(nl.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400" title="Delete"><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-bounce-in">
            <h2 className="text-xl font-black neon-text mb-4">Create Newsletter</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={newNL.subject.de} onChange={(e) => setNewNL({ ...newNL, subject: { ...newNL.subject, de: e.target.value } })} placeholder="Subject (DE)" className="neon-input" required />
              <input value={newNL.subject.en} onChange={(e) => setNewNL({ ...newNL, subject: { ...newNL.subject, en: e.target.value } })} placeholder="Subject (EN)" className="neon-input" />
              <textarea value={newNL.body.de} onChange={(e) => setNewNL({ ...newNL, body: { ...newNL.body, de: e.target.value } })} placeholder="Body (DE)" className="neon-input h-32" required />
              <textarea value={newNL.body.en} onChange={(e) => setNewNL({ ...newNL, body: { ...newNL.body, en: e.target.value } })} placeholder="Body (EN)" className="neon-input h-32" />
              <select value={newNL.template} onChange={(e) => setNewNL({ ...newNL, template: e.target.value })} className="neon-input">
                <option value="default">Default</option><option value="event">Event</option>
                <option value="urgent">Urgent</option><option value="newsletter">Newsletter</option>
              </select>
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

export default NewslettersPage;
