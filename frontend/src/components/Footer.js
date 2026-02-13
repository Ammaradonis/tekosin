import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-tekosin-border bg-tekosin-dark/50 px-6 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neon-pink font-bold animate-heartbeat inline-block">❤️</span>
          <span className="bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-green bg-clip-text text-transparent font-bold">
            {t('footer.madeWith')}
          </span>
          <span className="text-neon-pink font-bold animate-heartbeat inline-block">❤️</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold animate-pulse">
            ⚠️ {t('footer.noHousing')}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <a href="https://www.instagram.com/tekosin.lgbtiq/" target="_blank" rel="noopener noreferrer" className="hover:text-neon-pink transition-colors">Instagram</a>
          <span>|</span>
          <a href="mailto:tekosinlgbti@gmx.at" className="hover:text-neon-cyan transition-colors">tekosinlgbti@gmx.at</a>
          <span>|</span>
          <span>+436508924805</span>
          <span>|</span>
          <span>Schwarzhorngasse 1, 1050 Wien</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
