import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiKey, FiSearch, FiShield } from 'react-icons/fi';

const UsersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'member', language: 'de' });

  useEffect(() => { loadUsers(); }, [search, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', { params: { search, role: roleFilter, limit: 50 } });
      setUsers(res.data.users);
    } catch (e) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      toast.success('User created!');
      setShowAddModal(false);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'member', language: 'de' });
      loadUsers();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to create user'); }
  };

  const handleResetPassword = async (id) => {
    try {
      const res = await api.post(`/users/${id}/reset-password`);
      toast.success(`Temp password: ${res.data.temporaryPassword}`);
    } catch (e) { toast.error('Reset failed'); }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { ...user, isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      loadUsers();
    } catch (e) { toast.error('Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      loadUsers();
    } catch (e) { toast.error(e.response?.data?.error || 'Delete failed'); }
  };

  const roleColors = {
    super_admin: 'bg-neon-red/20 text-neon-red', admin: 'bg-neon-pink/20 text-neon-pink',
    member_manager: 'bg-neon-cyan/20 text-neon-cyan', payment_manager: 'bg-neon-green/20 text-neon-green',
    content_manager: 'bg-neon-purple/20 text-neon-purple', event_manager: 'bg-neon-orange/20 text-neon-orange',
    volunteer_manager: 'bg-pink-500/20 text-pink-400', report_manager: 'bg-neon-blue/20 text-neon-blue',
    member: 'bg-gray-500/20 text-gray-400'
  };

  const roles = ['admin', 'member_manager', 'payment_manager', 'content_manager', 'event_manager', 'volunteer_manager', 'report_manager', 'member'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiShield /> {t('nav.users')}</h1>
          <p className="text-sm text-gray-400">{users.length} users</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="neon-button text-sm flex items-center gap-2"><FiPlus /> Create User</button>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="neon-input pl-10" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="neon-input w-auto">
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-tekosin-border">
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Name</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Email</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Role</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Status</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Last Login</th>
              <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center"><div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="table-row border-b border-tekosin-border/50">
                <td className="p-3 text-sm font-medium">{u.firstName} {u.lastName}</td>
                <td className="p-3 text-sm text-gray-400">{u.email}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${roleColors[u.role] || ''}`}>{u.role?.replace('_', ' ')}</span></td>
                <td className="p-3">
                  <button onClick={() => handleToggleActive(u)} className={`px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer ${u.isActive ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-red/20 text-neon-red'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 text-sm text-gray-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('de-AT') : '—'}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleResetPassword(u.id)} className="p-1.5 rounded-lg hover:bg-neon-cyan/10 text-neon-cyan" title="Reset Password"><FiKey size={14} /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400" title="Delete"><FiTrash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-bounce-in">
            <h2 className="text-xl font-black neon-text mb-4">Create User</h2>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} placeholder="First Name" className="neon-input" required />
                <input value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} placeholder="Last Name" className="neon-input" required />
              </div>
              <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" className="neon-input" type="email" required />
              <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password (min 8 chars)" className="neon-input" type="password" required minLength={8} />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="neon-input">
                {roles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
              <select value={newUser.language} onChange={(e) => setNewUser({ ...newUser, language: e.target.value })} className="neon-input">
                <option value="de">Deutsch</option><option value="en">English</option>
                <option value="tr">Türkçe</option><option value="ar">العربية</option>
                <option value="fa">فارسی</option><option value="es">Español</option>
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

export default UsersPage;
