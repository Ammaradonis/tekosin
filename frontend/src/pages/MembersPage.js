import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { fetchMembers, deleteMember } from '../store/membersSlice';
import toast from 'react-hot-toast';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiDownload, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';

const MembersPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { members, pagination, loading } = useSelector((state) => state.members);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '', nationality: '', asylumStatus: '', gender: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    dispatch(fetchMembers({ page, limit: 20, search, status: statusFilter }));
  }, [dispatch, page, search, statusFilter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await dispatch(deleteMember(id));
      toast.success('Member deleted');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/exports/members/csv', { params: { status: statusFilter }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `members_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported!');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/exports/members/pdf', { params: { status: statusFilter }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `members_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF exported!');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post('/members', newMember);
      toast.success('Member created!');
      setShowAddModal(false);
      setNewMember({ firstName: '', lastName: '', email: '', phone: '', nationality: '', asylumStatus: '', gender: '' });
      dispatch(fetchMembers({ page, limit: 20, search, status: statusFilter }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create member');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) { toast.error('Select members first'); return; }
    try {
      await api.post('/members/bulk', { action, memberIds: selectedIds });
      toast.success(`Bulk ${action} completed`);
      setSelectedIds([]);
      dispatch(fetchMembers({ page, limit: 20, search, status: statusFilter }));
    } catch (e) {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const statusColors = {
    active: 'bg-neon-green/20 text-neon-green border-neon-green/30',
    pending: 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    suspended: 'bg-neon-red/20 text-neon-red border-neon-red/30',
    archived: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black neon-text">{t('members.title')}</h1>
          <p className="text-sm text-gray-400">{pagination?.total || 0} total members</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddModal(true)} className="neon-button text-sm flex items-center gap-2">
            <FiPlus /> {t('members.addNew')}
          </button>
          <button onClick={handleExportCSV} className="neon-button-cyan text-sm flex items-center gap-2 px-4 py-2 rounded-xl font-bold">
            <FiDownload /> CSV
          </button>
          <button onClick={handleExportPDF} className="neon-button-green text-sm flex items-center gap-2 px-4 py-2 rounded-xl font-bold">
            <FiDownload /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={handleSearch} placeholder={t('members.search')} className="neon-input pl-10" />
        </div>
        <div className="flex gap-2 items-center">
          <FiFilter className="text-neon-cyan" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="neon-input w-auto">
            <option value="">{t('common.all')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="pending">{t('common.pending')}</option>
            <option value="inactive">{t('common.inactive')}</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="glass-card p-3 flex items-center gap-3 border-neon-cyan/30">
          <span className="text-sm text-neon-cyan font-bold">{selectedIds.length} selected</span>
          <button onClick={() => handleBulkAction('activate')} className="px-3 py-1 rounded-lg bg-neon-green/20 text-neon-green text-xs font-bold">Activate</button>
          <button onClick={() => handleBulkAction('deactivate')} className="px-3 py-1 rounded-lg bg-gray-500/20 text-gray-400 text-xs font-bold">Deactivate</button>
          <button onClick={() => handleBulkAction('delete')} className="px-3 py-1 rounded-lg bg-neon-red/20 text-neon-red text-xs font-bold">Delete</button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tekosin-border">
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">
                  <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? members.map(m => m.id) : [])} className="rounded" />
                </th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('members.firstName')}</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('members.lastName')}</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('members.email')}</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('members.nationality')}</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('members.status')}</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('members.asylumStatus')}</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">{t('members.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">{t('common.noData')}</td></tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="table-row border-b border-tekosin-border/50">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIds.includes(member.id)} onChange={() => toggleSelect(member.id)} className="rounded" />
                    </td>
                    <td className="p-3 text-sm font-medium">{member.firstName}</td>
                    <td className="p-3 text-sm font-medium">{member.lastName}</td>
                    <td className="p-3 text-sm text-gray-400">{member.email || '—'}</td>
                    <td className="p-3 text-sm">{member.nationality || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statusColors[member.membershipStatus] || 'bg-gray-500/20 text-gray-400'}`}>
                        {member.membershipStatus}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{member.asylumStatus || '—'}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/members/${member.id}`)} className="p-1.5 rounded-lg hover:bg-neon-cyan/10 text-neon-cyan" title={t('members.view')}><FiEye size={14} /></button>
                        <button onClick={() => navigate(`/members/${member.id}`)} className="p-1.5 rounded-lg hover:bg-neon-pink/10 text-neon-pink" title={t('members.edit')}><FiEdit2 size={14} /></button>
                        <button onClick={() => handleDelete(member.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400" title={t('members.delete')}><FiTrash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-tekosin-border">
            <p className="text-sm text-gray-400">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-tekosin-card disabled:opacity-30"><FiChevronLeft /></button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-2 rounded-lg hover:bg-tekosin-card disabled:opacity-30"><FiChevronRight /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-bounce-in">
            <h2 className="text-xl font-black neon-text mb-4">{t('members.addNew')}</h2>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={newMember.firstName} onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })} placeholder={t('members.firstName')} className="neon-input" required />
                <input value={newMember.lastName} onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })} placeholder={t('members.lastName')} className="neon-input" required />
              </div>
              <input value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} placeholder={t('members.email')} className="neon-input" type="email" />
              <input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder={t('members.phone')} className="neon-input" />
              <div className="grid grid-cols-2 gap-3">
                <input value={newMember.nationality} onChange={(e) => setNewMember({ ...newMember, nationality: e.target.value })} placeholder={t('members.nationality')} className="neon-input" />
                <select value={newMember.asylumStatus} onChange={(e) => setNewMember({ ...newMember, asylumStatus: e.target.value })} className="neon-input">
                  <option value="">Asylum Status</option>
                  <option value="pending">Pending</option>
                  <option value="subsidiary_protection">Subsidiary Protection</option>
                  <option value="asylum_granted">Asylum Granted</option>
                  <option value="rejected">Rejected</option>
                  <option value="appeal">Appeal</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="neon-button flex-1">{t('common.save')}</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 rounded-xl border border-tekosin-border hover:bg-tekosin-card transition-colors">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
