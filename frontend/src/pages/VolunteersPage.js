import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiHeart, FiPlus, FiTrash2, FiSearch } from 'react-icons/fi';

const VolunteersPage = () => {
  const { t } = useTranslation();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadVolunteers(); }, [search, statusFilter]);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/volunteers', { params: { search, status: statusFilter, limit: 50 } });
      setVolunteers(res.data.volunteers);
    } catch (e) { toast.error('Failed to load volunteers'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/volunteers/${id}`); toast.success('Deleted'); loadVolunteers(); }
    catch (e) { toast.error('Failed'); }
  };

  const statusColors = { active: 'bg-neon-green/20 text-neon-green', inactive: 'bg-gray-500/20 text-gray-400', pending: 'bg-neon-yellow/20 text-neon-yellow' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiHeart /> {t('nav.volunteers')}</h1>
      </div>
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="neon-input pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="neon-input w-auto">
          <option value="">All</option><option value="active">Active</option><option value="pending">Pending</option><option value="inactive">Inactive</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-tekosin-border">
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Name</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Email</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Skills</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Hours</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Status</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {volunteers.map(v => (
                <tr key={v.id} className="table-row border-b border-tekosin-border/50">
                  <td className="p-3 text-sm font-medium">{v.firstName} {v.lastName}</td>
                  <td className="p-3 text-sm text-gray-400">{v.email || '—'}</td>
                  <td className="p-3 text-sm text-gray-400">{(v.skills || []).join(', ') || '—'}</td>
                  <td className="p-3 text-sm font-bold text-neon-cyan">{v.hoursLogged}h</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[v.status] || ''}`}>{v.status}</span></td>
                  <td className="p-3"><button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><FiTrash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VolunteersPage;
