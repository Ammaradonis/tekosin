import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';
import { setLanguage } from '../store/uiSlice';
import { FiSettings, FiUser, FiLock, FiGlobe, FiShield, FiInfo } from 'react-icons/fi';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      toast.success('Password updated!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    dispatch(setLanguage(code));
    toast.success(`Language changed to ${code.toUpperCase()}`);
  };

  const languages = [
    { code: 'de', label: 'Deutsch', flag: '🇦🇹' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' }
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'language', label: 'Language', icon: FiGlobe },
    { id: 'about', label: 'About', icon: FiInfo }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiSettings /> {t('nav.settings')}</h1>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' : 'text-gray-400 hover:bg-tekosin-card'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-neon-cyan">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-gray-400 mb-1">Name</label><p className="text-lg font-bold">{user?.firstName} {user?.lastName}</p></div>
            <div><label className="block text-sm text-gray-400 mb-1">Email</label><p className="text-lg">{user?.email}</p></div>
            <div><label className="block text-sm text-gray-400 mb-1">Role</label><p className="text-lg"><span className="px-3 py-1 rounded-full bg-neon-pink/20 text-neon-pink font-bold text-sm">{user?.role?.replace('_', ' ')}</span></p></div>
            <div><label className="block text-sm text-gray-400 mb-1">Language</label><p className="text-lg">{languages.find(l => l.code === user?.language)?.label || 'Deutsch'}</p></div>
            <div><label className="block text-sm text-gray-400 mb-1">Last Login</label><p className="text-sm text-gray-400">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString('de-AT') : '—'}</p></div>
            <div><label className="block text-sm text-gray-400 mb-1">GDPR Consent</label><p className="text-sm">{user?.gdprConsent ? '✅ Granted' : '❌ Not granted'}</p></div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold text-neon-cyan flex items-center gap-2"><FiLock /> Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="neon-input" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">New Password (min 8 chars)</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="neon-input" required minLength={8} />
            </div>
            <button type="submit" className="neon-button text-sm">Update Password</button>
          </form>
          <div className="border-t border-tekosin-border pt-4">
            <h4 className="font-bold text-sm mb-2">Security Info</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• JWT-based authentication with refresh tokens</li>
              <li>• Passwords hashed with bcrypt (12 rounds)</li>
              <li>• Account lockout after 5 failed attempts</li>
              <li>• Rate limiting on authentication endpoints</li>
              <li>• All actions logged in audit trail</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'language' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-neon-cyan flex items-center gap-2"><FiGlobe /> Language / Sprache</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {languages.map(lang => (
              <button key={lang.code} onClick={() => handleLanguageChange(lang.code)}
                className={`p-4 rounded-xl border transition-all text-left ${i18n.language === lang.code ? 'border-neon-pink/50 bg-neon-pink/10' : 'border-tekosin-border hover:border-neon-cyan/30'}`}>
                <span className="text-2xl">{lang.flag}</span>
                <p className="font-bold mt-2">{lang.label}</p>
                <p className="text-xs text-gray-400">{lang.code.toUpperCase()}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-neon-cyan">About TÊKOȘÎN</h3>
          <div className="space-y-3 text-sm">
            <p className="font-bold text-lg neon-text">TÊKOȘÎN</p>
            <p className="text-gray-400">Verein für LGBTIQ-Geflüchtete und Migrant*innen in Wien</p>
            <p className="text-gray-400">Association for LGBTIQ Refugees and Migrants in Vienna</p>
            <div className="border-t border-tekosin-border pt-3 space-y-2">
              <p>📧 <a href="mailto:tekosinlgbti@gmx.at" className="text-neon-cyan hover:underline">tekosinlgbti@gmx.at</a></p>
              <p>📱 <a href="tel:+436508924805" className="text-neon-cyan hover:underline">+436508924805</a></p>
              <p>📍 Schwarzhorngasse 1, 1050 Wien</p>
              <p>📸 <a href="https://www.instagram.com/tekosin.lgbtiq/" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">@tekosin.lgbtiq</a></p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-bold">
              ⚠️ {t('footer.noHousing')}
            </div>
            <div className="pt-3 text-center">
              <p className="text-sm">
                <span className="animate-heartbeat inline-block">❤️</span>
                {' '}<span className="bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-green bg-clip-text text-transparent font-bold">{t('footer.madeWith')}</span>{' '}
                <span className="animate-heartbeat inline-block">❤️</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
