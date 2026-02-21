import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { login, clearError } from '../store/authSlice';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const copyValue = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1200);
    } catch (e) {
      setCopiedKey('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const languages = [
    { code: 'de', label: 'DE' }, { code: 'en', label: 'EN' },
    { code: 'tr', label: 'TR' }, { code: 'ar', label: 'AR' },
    { code: 'fa', label: 'FA' }, { code: 'es', label: 'ES' }
  ];

  return (
    <div className="min-h-screen bg-tekosin-darker flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-neon-pink/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-neon-cyan/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Language selector */}
        <div className="flex justify-center gap-2 mb-6">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                i18n.language === lang.code
                  ? 'bg-neon-pink text-white shadow-lg shadow-neon-pink/30'
                  : 'bg-tekosin-card text-gray-400 hover:text-white'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Crisis banner */}
        <div className="crisis-banner rounded-t-2xl text-xs font-black py-2">
          🚨 {t('crisis.urgent')} 🚨
        </div>

        {/* Login card */}
        <div className="glass-card rounded-b-2xl p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-bg flex items-center justify-center animate-pulse-neon">
              <span className="text-3xl font-black text-black">T</span>
            </div>
            <h1 className="text-3xl font-black neon-text mb-2">TÊKOȘÎN</h1>
            <p className="text-sm text-gray-400">{t('app.subtitle')}</p>
            <p className="text-xs text-red-400 mt-2 font-bold animate-pulse">
              ⚠️ {t('footer.noHousing')}
            </p>
          </div>

          <h2 className="text-xl font-bold text-center mb-1 neon-text-cyan">{t('auth.welcomeBack')}</h2>
          <p className="text-center text-gray-400 text-sm mb-6">{t('auth.loginSubtitle')}</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-neon-cyan mb-1">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neon-input"
                placeholder="admin@tekosin.org"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neon-cyan mb-1">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neon-input"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full neon-button text-lg font-black py-3 animate-pulse-neon disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Demo: admin@tekosin.org / Admin123!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-sm">
            <span className="animate-heartbeat inline-block">❤️</span>
            {' '}
            <span className="bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-green bg-clip-text text-transparent font-bold">
              {t('footer.madeWith')}
            </span>
            {' '}
            <span className="animate-heartbeat inline-block">❤️</span>
          </p>
          <div className="border-t border-tekosin-border/60 pt-3 space-y-1">
            <p className="text-sm font-bold text-neon-cyan">{t('footer.supportCta')}</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-xs text-gray-300">Têkosin LGBTIQ - Verein für LGBT</p>
              <button
                type="button"
                onClick={() => copyValue('bank', 'Têkosin LGBTIQ - Verein für LGBT')}
                className="px-4 py-1 rounded-md bg-neon-cyan text-black font-black text-xs hover:opacity-90 transition-opacity"
              >
                {copiedKey === 'bank' ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div className="flex items-center justify-center gap-3">
              <p className="text-xs text-gray-300">AT371700000141011537</p>
              <button
                type="button"
                onClick={() => copyValue('iban', 'AT371700000141011537')}
                className="px-4 py-1 rounded-md bg-neon-cyan text-black font-black text-xs hover:opacity-90 transition-opacity"
              >
                {copiedKey === 'iban' ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div className="flex items-center justify-center gap-3">
              <p className="text-xs text-gray-300">BIC: BFKKAT2K</p>
              <button
                type="button"
                onClick={() => copyValue('bic', 'BFKKAT2K')}
                className="px-4 py-1 rounded-md bg-neon-cyan text-black font-black text-xs hover:opacity-90 transition-opacity"
              >
                {copiedKey === 'bic' ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
