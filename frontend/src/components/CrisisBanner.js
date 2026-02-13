import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CrisisBanner = () => {
  const { t } = useTranslation();
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    t('crisis.urgent'),
    t('crisis.shocking'),
    t('crisis.alert')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="crisis-banner text-xs md:text-sm font-black tracking-widest z-50">
      <span className="inline-block animate-shake">🚨</span>
      {' '}{messages[currentMessage]}{' '}
      <span className="inline-block animate-shake">🚨</span>
    </div>
  );
};

export default CrisisBanner;
