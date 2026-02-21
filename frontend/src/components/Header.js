import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { setLanguage } from '../store/uiSlice';
import { FiBell, FiLogOut, FiGlobe, FiUser } from 'react-icons/fi';

const Header = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const languages = [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'ar', label: 'العربية' },
    { code: 'fa', label: 'فارسی' },
    { code: 'es', label: 'Español' }
  ];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    dispatch(setLanguage(code));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/portal');
  };

  return (
    <header className="sticky top-0 z-30 bg-tekosin-dark/80 backdrop-blur-xl border-b border-tekosin-border px-3 md:px-6 py-2 md:py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 pl-8 md:pl-0">
          <h2 className="text-xs md:text-sm font-bold text-neon-pink/70 uppercase tracking-wider truncate">
            {t('app.subtitle')}
          </h2>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Language Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2 md:px-3 py-2 rounded-lg hover:bg-tekosin-card transition-colors text-sm">
              <FiGlobe className="text-neon-cyan" size={16} />
              <span className="hidden md:inline">{languages.find(l => l.code === i18n.language)?.label || 'Deutsch'}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-tekosin-card border border-tekosin-border rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[140px] z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-neon-pink/10 transition-colors first:rounded-t-lg last:rounded-b-lg ${i18n.language === lang.code ? 'text-neon-pink font-bold' : ''}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-tekosin-card transition-colors"
          >
            <FiBell className="text-neon-cyan" size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-red rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">!</span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-3 border-l border-tekosin-border">
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
              <FiUser size={14} className="text-black" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-neon-pink/60">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
              title={t('auth.logout')}
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
