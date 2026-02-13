import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiEdit2, FiSave, FiShield, FiDownload, FiTrash2, FiFile, FiMessageSquare } from 'react-icons/fi';

const MemberDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadMember();
  }, [id]);

  const loadMember = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/members/${id}`);
      setMember(res.data);
      setEditData(res.data);
    } catch (e) {
      toast.error('Failed to load member');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/members/${id}`, editData);
      toast.success('Member updated!');
      setEditing(false);
      loadMember();
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const handleGdprForget = async () => {
    if (window.confirm('This will permanently erase all personal data. This cannot be undone. Continue?')) {
      try {
        await api.delete(`/members/${id}/gdpr-forget`);
        toast.success('Data erased per GDPR');
        navigate('/members');
      } catch (e) {
        toast.error('GDPR erasure failed');
      }
    }
  };

  const handleGdprExport = async () => {
    try {
      const res = await api.get(`/members/${id}/gdpr-export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gdpr_export_${id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('GDPR data exported');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-neon-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!member) return null;

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'documents', label: 'Documents' },
    { id: 'payments', label: 'Payments' },
    { id: 'notes', label: 'Notes' },
    { id: 'services', label: 'Services' },
    { id: 'referrals', label: 'Referrals' },
    { id: 'gdpr', label: 'GDPR' }
  ];

  const statusColors = {
    active: 'bg-neon-green/20 text-neon-green',
    pending: 'bg-neon-yellow/20 text-neon-yellow',
    inactive: 'bg-gray-500/20 text-gray-400',
    suspended: 'bg-neon-red/20 text-neon-red'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/members')} className="p-2 rounded-lg hover:bg-tekosin-card"><FiArrowLeft /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-black neon-text">{member.firstName} {member.lastName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[member.membershipStatus] || ''}`}>{member.membershipStatus}</span>
            {member.isConfidential && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">🔒 Confidential</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <button onClick={handleSave} className="neon-button text-sm flex items-center gap-2"><FiSave /> {t('common.save')}</button>
          ) : (
            <button onClick={() => setEditing(true)} className="neon-button text-sm flex items-center gap-2"><FiEdit2 /> {t('common.edit')}</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' : 'text-gray-400 hover:bg-tekosin-card'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-neon-cyan">Personal Information</h3>
            {[
              { label: 'First Name', key: 'firstName' }, { label: 'Last Name', key: 'lastName' },
              { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' },
              { label: 'Date of Birth', key: 'dateOfBirth' }, { label: 'Gender', key: 'gender' },
              { label: 'Pronouns', key: 'pronouns' }, { label: 'Nationality', key: 'nationality' },
              { label: 'Country of Origin', key: 'countryOfOrigin' }
            ].map(field => (
              <div key={field.key} className="flex items-center gap-4">
                <label className="w-40 text-sm text-gray-400">{field.label}</label>
                {editing ? (
                  <input value={editData[field.key] || ''} onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })} className="neon-input flex-1" />
                ) : (
                  <span className="text-sm">{member[field.key] || '—'}</span>
                )}
              </div>
            ))}
            <div className="flex items-center gap-4">
              <label className="w-40 text-sm text-gray-400">Languages</label>
              <span className="text-sm">{(member.languages || []).join(', ') || '—'}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-neon-cyan">Address & Asylum</h3>
              {[
                { label: 'Address', key: 'address' }, { label: 'City', key: 'city' },
                { label: 'Postal Code', key: 'postalCode' }, { label: 'Asylum Status', key: 'asylumStatus' },
                { label: 'Application Date', key: 'asylumApplicationDate' }
              ].map(field => (
                <div key={field.key} className="flex items-center gap-4">
                  <label className="w-40 text-sm text-gray-400">{field.label}</label>
                  {editing ? (
                    <input value={editData[field.key] || ''} onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })} className="neon-input flex-1" />
                  ) : (
                    <span className="text-sm">{member[field.key] || '—'}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-neon-cyan">Emergency Contact</h3>
              {[
                { label: 'Name', key: 'emergencyContactName' },
                { label: 'Phone', key: 'emergencyContactPhone' },
                { label: 'Relation', key: 'emergencyContactRelation' }
              ].map(field => (
                <div key={field.key} className="flex items-center gap-4">
                  <label className="w-40 text-sm text-gray-400">{field.label}</label>
                  <span className="text-sm">{member[field.key] || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-neon-cyan mb-4 flex items-center gap-2"><FiFile /> Documents</h3>
          <div className="space-y-2">
            {(member.Documents || []).length === 0 ? (
              <p className="text-gray-500 text-sm">{t('common.noData')}</p>
            ) : (
              member.Documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-tekosin-card/50">
                  <div>
                    <p className="text-sm font-bold">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.type} | {doc.status} {doc.expiryDate ? `| Expires: ${doc.expiryDate}` : ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${doc.status === 'valid' ? 'bg-neon-green/20 text-neon-green' : doc.status === 'expired' ? 'bg-neon-red/20 text-neon-red' : 'bg-neon-yellow/20 text-neon-yellow'}`}>{doc.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-neon-cyan mb-4">Payment History</h3>
          <div className="space-y-2">
            {(member.Payments || []).length === 0 ? (
              <p className="text-gray-500 text-sm">{t('common.noData')}</p>
            ) : (
              member.Payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-tekosin-card/50">
                  <div>
                    <p className="text-sm font-bold">€{p.amount} - {p.type}</p>
                    <p className="text-xs text-gray-400">{p.description} | {new Date(p.createdAt).toLocaleDateString('de-AT')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.status === 'completed' ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-yellow/20 text-neon-yellow'}`}>{p.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-neon-cyan mb-4 flex items-center gap-2"><FiMessageSquare /> Notes</h3>
          <div className="space-y-3">
            {(member.Notes || []).length === 0 ? (
              <p className="text-gray-500 text-sm">{t('common.noData')}</p>
            ) : (
              member.Notes.map(note => (
                <div key={note.id} className={`p-4 rounded-lg border ${note.isConfidential ? 'border-red-500/30 bg-red-500/5' : 'border-tekosin-border bg-tekosin-card/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-neon-pink">{note.type}</span>
                    {note.isConfidential && <span className="text-xs text-red-400">🔒 Confidential</span>}
                  </div>
                  <h4 className="font-bold text-sm">{note.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-2">{new Date(note.createdAt).toLocaleString('de-AT')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-neon-cyan mb-4">Services</h3>
          <div className="space-y-2">
            {(member.Services || []).length === 0 ? (
              <p className="text-gray-500 text-sm">{t('common.noData')}</p>
            ) : (
              member.Services.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-tekosin-card/50">
                  <div>
                    <p className="text-sm font-bold">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.type} | {s.provider || 'N/A'} | {s.startDate || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.status === 'active' ? 'bg-neon-green/20 text-neon-green' : s.status === 'completed' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-neon-yellow/20 text-neon-yellow'}`}>{s.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-neon-cyan mb-4">Referrals</h3>
          <div className="space-y-2">
            {(member.Referrals || []).length === 0 ? (
              <p className="text-gray-500 text-sm">{t('common.noData')}</p>
            ) : (
              member.Referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-tekosin-card/50">
                  <div>
                    <p className="text-sm font-bold">{r.referredTo} - {r.organization}</p>
                    <p className="text-xs text-gray-400">{r.type} | {r.reason}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.status === 'completed' ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-yellow/20 text-neon-yellow'}`}>{r.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'gdpr' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold text-neon-cyan flex items-center gap-2"><FiShield /> {t('gdpr.consent')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-tekosin-border">
              <p className="text-sm font-bold mb-1">GDPR Consent</p>
              <p className="text-xs text-gray-400">{member.gdprConsent ? '✅ Granted' : '❌ Not granted'}</p>
              {member.gdprConsentDate && <p className="text-xs text-gray-500">Date: {new Date(member.gdprConsentDate).toLocaleDateString('de-AT')}</p>}
            </div>
            <div className="p-4 rounded-lg border border-tekosin-border">
              <p className="text-sm font-bold mb-1">Photo Consent</p>
              <p className="text-xs text-gray-400">{member.photoConsent ? '✅ Granted' : '❌ Not granted'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleGdprExport} className="neon-button-cyan text-sm flex items-center gap-2 px-4 py-2 rounded-xl font-bold">
              <FiDownload /> {t('members.gdprExport')}
            </button>
            <button onClick={handleGdprForget} className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center gap-2">
              <FiTrash2 /> {t('members.gdprForget')}
            </button>
          </div>
          <p className="text-xs text-red-400 font-bold animate-pulse">⚠️ {t('footer.noHousing')}</p>
        </div>
      )}
    </div>
  );
};

export default MemberDetailPage;
