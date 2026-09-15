import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Star,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react';
import './AdminSidebar.css';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/admin/customers', label: 'Customers', icon: Users },
  { path: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { path: '/admin/reviews', label: 'Reviews', icon: Star },
];

const sidebarVariants = {
  open: {
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  closed: {
    x: '-100%',
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

const overlayVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 },
};

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <span>अ</span>
        </div>
        <div className="sidebar-brand-text">
          <h1>ANNAPURNA</h1>
          <p>Maa's Kitchen Account</p>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`sidebar-nav-link ${active ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="sidebar-nav-icon">
                    <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  </span>
                  <span className="sidebar-nav-label">{item.label}</span>
                  {active && (
                    <motion.span
                      className="sidebar-active-indicator"
                      layoutId="activeNav"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={1.8} />
          <span>Log Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar — always visible */}
      <aside className="sidebar-desktop" id="admin-sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile/Tablet Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="sidebar-overlay"
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={onClose}
            />
            <motion.aside
              className="sidebar-mobile"
              id="admin-sidebar-mobile"
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
