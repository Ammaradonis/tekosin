import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import CrisisBanner from './CrisisBanner';
import { useSelector } from 'react-redux';

const Layout = () => {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-tekosin-darker flex flex-col">
      <CrisisBanner />
      <div className="flex flex-1">
        <Sidebar />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
          <Header />
          <main className="flex-1 p-3 md:p-6 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
