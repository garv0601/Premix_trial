import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, User } from 'lucide-react';

/**
 * ANNAPURNA — Mobile Bottom Navigation
 *
 * A premium, minimal floating bar shown only on mobile/tablet (< 768px).
 * On desktop it is hidden so the existing top navigation stays in charge.
 * Navigation targets and app behaviour are unchanged — this is presentation only.
 */

const NAV_ITEMS = [
  { label: 'Home', to: '/', icon: Home, isActive: (p) => p === '/' },
  { label: 'Shop', to: '/shop', icon: ShoppingBag, isActive: (p) => p.startsWith('/shop') || p.startsWith('/product') },
  { label: 'Orders', to: '/orders', icon: Package, isActive: (p) => p.startsWith('/orders') },
  { label: 'Account', to: '/account', icon: User, isActive: (p) => p.startsWith('/account') },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <>
      <nav
        className="ann-bottom-nav"
        aria-label="Primary"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
          zIndex: 1000,
          width: 'calc(100% - 16px)',
          maxWidth: '480px',
          justifyContent: 'space-around',
          alignItems: 'stretch',
          gap: '2px',
          padding: '8px',
          boxSizing: 'border-box',
          background: 'rgba(255, 248, 244, 0.82)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          border: '1px solid rgba(93, 64, 55, 0.10)',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(93, 64, 55, 0.14), 0 2px 8px rgba(93, 64, 55, 0.06)',
        }}
      >
        {NAV_ITEMS.map(({ label, to, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '7px 4px',
                borderRadius: '14px',
                textDecoration: 'none',
                color: active ? '#B22222' : '#7A5C4A',
                background: active ? 'rgba(178, 34, 34, 0.08)' : 'transparent',
                transition: 'color 0.2s ease, background 0.2s ease',
              }}
            >
              <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
              <span
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '11px',
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile-only visibility, safe-area spacing and float adjustments */}
      <style>{`
        .ann-bottom-nav { display: none; }
        @media (max-width: 767px) {
          .ann-bottom-nav { display: flex; }
          body { padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px)); }
          #wa-float { bottom: calc(92px + env(safe-area-inset-bottom, 0px)) !important; }
        }
      `}</style>
    </>
  );
}
