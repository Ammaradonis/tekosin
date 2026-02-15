import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toggleSidebar, setSidebarOpen } from '../store/uiSlice';
import { FiHome, FiUsers, FiDollarSign, FiCalendar, FiFileText, FiSettings, FiBell, FiShield, FiBarChart2, FiMail, FiHeart, FiMenu, FiChevronLeft, FiX } from 'react-icons/fi';

const Sidebar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) {
      dispatch(setSidebarOpen(false));
    }
  }, [location.pathname, dispatch]);

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        dispatch(setSidebarOpen(false));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const navItems = [
    { path: '/dashboard', icon: FiHome, label: t('nav.dashboard') },
    { path: '/members', icon: FiUsers, label: t('nav.members'), roles: ['super_admin', 'admin', 'member_manager'] },
    { path: '/payments', icon: FiDollarSign, label: t('nav.payments'), roles: ['super_admin', 'admin', 'payment_manager'] },
    { path: '/events', icon: FiCalendar, label: t('nav.events'), roles: ['super_admin', 'admin', 'event_manager'] },
    { path: '/content', icon: FiFileText, label: t('nav.content'), roles: ['super_admin', 'admin', 'content_manager'] },
    { path: '/volunteers', icon: FiHeart, label: t('nav.volunteers'), roles: ['super_admin', 'admin', 'volunteer_manager'] },
    { path: '/users', icon: FiShield, label: t('nav.users'), roles: ['super_admin', 'admin'] },
    { path: '/notifications', icon: FiBell, label: t('nav.notifications') },
    { path: '/reports', icon: FiBarChart2, label: t('nav.reports'), roles: ['super_admin', 'admin', 'report_manager'] },
    { path: '/audit', icon: FiShield, label: t('nav.audit'), roles: ['super_admin', 'admin'] },
    { path: '/newsletters', icon: FiMail, label: t('nav.newsletters'), roles: ['super_admin', 'admin', 'content_manager'] },
    { path: '/settings', icon: FiSettings, label: t('nav.settings') }
  ];

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Mobile hamburger toggle (visible when sidebar is closed on mobile) */}
      {!sidebarOpen && (
        <button
          onClick={() => dispatch(setSidebarOpen(true))}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-tekosin-dark border border-tekosin-border text-neon-cyan md:hidden"
        >
          <FiMenu size={20} />
        </button>
      )}

      <aside className={`fixed left-0 top-0 h-full bg-tekosin-dark border-r border-tekosin-border z-40 transition-all duration-300
        ${sidebarOpen ? 'w-64 translate-x-0' : 'md:w-16 -translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b border-tekosin-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-black font-black text-sm">T</div>
              <span className="font-black text-lg neon-text">TÊKOȘÎN</span>
            </div>
          )}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-lg hover:bg-tekosin-card transition-colors text-neon-cyan"
          >
            {sidebarOpen ? <FiX size={18} className="md:hidden" /> : null}
            {sidebarOpen ? <FiChevronLeft size={18} className="hidden md:block" /> : <FiMenu size={18} />}
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-3' : ''}`
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
