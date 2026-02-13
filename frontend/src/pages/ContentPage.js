import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiFileText, FiPlus, FiEdit2, FiTrash2, FiEye, FiSend } from 'react-icons/fi';

const ContentPage = () => {
  const { t, i18n } = useTranslation();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState({ title: { de: '', en: '' }, slug: '', body: { de: '', en: '' }, type: 'blog', status: 'draft', category: '', tags: '' });

  useEffect(() => { loadContent(); }, [typeFilter, statusFilter]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/content', { params: { limit: 50, type: typeFilter, status: statusFilter } });
      setContents(res.data.contents);
    } catch (e) { toast.error('Failed to load content'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...newContent,
        title: { de: newContent.title.de, en: newContent.title.en, tr: '', ar: '', fa: '', es: '' },
        body: { de: newContent.body.de, en: newContent.body.en, tr: '', ar: '', fa: '', es: '' },
        tags: newContent.tags ? newContent.tags.split(',').map(t => t.trim()) : []
      };
      await api.post('/content', data);
      toast.success('Content created!');
      setShowAddModal(false);
      loadContent();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to create content'); }
  };

  const handlePublish = async (id) => {
    try { await api.post(`/content/${id}/publish`); toast.success('Published!'); loadContent(); }
    catch (e) { toast.error('Publish failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content?')) return;
    try { await api.delete(`/content/${id}`); toast.success('Deleted'); loadContent(); }
    catch (e) { toast.error('Delete failed'); }
  };

  const getTitle = (titleObj) => {
    if (!titleObj) return '—';
    if (typeof titleObj === 'string') return titleObj;
    return titleObj[i18n.language] || titleObj.de || titleObj.en || '—';
  };

  const statusColors = { draft: 'bg-gray-500/20 text-gray-400', published: 'bg-neon-green/20 text-neon-green', archived: 'bg-purple-500/20 text-purple-400', review: 'bg-neon-yellow/20 text-neon-yellow' };
  const typeColors = { page: 'bg-neon-cyan/20 text-neon-cyan', blog: 'bg-neon-pink/20 text-neon-pink', document: 'bg-neon-blue/20 text-neon-blue', announcement: 'bg-neon-orange/20 text-neon-orange', media: 'bg-neon-green/20 text-neon-green' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiFileText /> {t('nav.content')}</h1>
        <button onClick={() => setShowAddModal(true)} className="neon-button text-sm flex items-center gap-2"><FiPlus /> Create Content</button>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="neon-input w-auto">
          <option value="">All Types</option>
          <option value="page">Page</option><option value="blog">Blog</option>
          <option value="document">Document</option><option value="announcement">Announcement</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="neon-input w-auto">
          <option value="">All Status</option>
          <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tekosin-border">
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Title</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Type</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Status</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Author</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Version</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Date</th>
                <th className="p-3 text-left text-xs font-bold text-neon-pink uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contents.map(c => (
                <tr key={c.id} className="table-row border-b border-tekosin-border/50">
                  <td className="p-3 text-sm font-medium max-w-[200px] truncate">{getTitle(c.title)}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeColors[c.type] || ''}`}>{c.type}</span></td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[c.status] || ''}`}>{c.status}</span></td>
                  <td className="p-3 text-sm text-gray-400">{c.author ? `${c.author.firstName} ${c.author.lastName}` : '—'}</td>
                  <td className="p-3 text-sm text-gray-400">v{c.version}</td>
                  <td className="p-3 text-sm text-gray-400">{new Date(c.createdAt).toLocaleDateString('de-AT')}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {c.status !== 'published' && <button onClick={() => handlePublish(c.id)} className="p-1.5 rounded-lg hover:bg-neon-green/10 text-neon-green" title="Publish"><FiSend size={14} /></button>}
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400" title="Delete"><FiTrash2 size={14} /></button>
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
          <div className="glass-card p-6 w-full max-w-lg animate-bounce-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black neon-text mb-4">Create Content</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={newContent.title.de} onChange={(e) => setNewContent({ ...newContent, title: { ...newContent.title, de: e.target.value } })} placeholder="Title (DE)" className="neon-input" required />
              <input value={newContent.title.en} onChange={(e) => setNewContent({ ...newContent, title: { ...newContent.title, en: e.target.value } })} placeholder="Title (EN)" className="neon-input" />
              <input value={newContent.slug} onChange={(e) => setNewContent({ ...newContent, slug: e.target.value })} placeholder="URL Slug" className="neon-input" required />
              <select value={newContent.type} onChange={(e) => setNewContent({ ...newContent, type: e.target.value })} className="neon-input">
                <option value="blog">Blog</option><option value="page">Page</option>
                <option value="document">Document</option><option value="announcement">Announcement</option>
              </select>
              <textarea value={newContent.body.de} onChange={(e) => setNewContent({ ...newContent, body: { ...newContent.body, de: e.target.value } })} placeholder="Body (DE)" className="neon-input h-32" />
              <textarea value={newContent.body.en} onChange={(e) => setNewContent({ ...newContent, body: { ...newContent.body, en: e.target.value } })} placeholder="Body (EN)" className="neon-input h-32" />
              <input value={newContent.category} onChange={(e) => setNewContent({ ...newContent, category: e.target.value })} placeholder="Category" className="neon-input" />
              <input value={newContent.tags} onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })} placeholder="Tags (comma separated)" className="neon-input" />
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

export default ContentPage;
