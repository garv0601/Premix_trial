import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Package,
  MapPin,
  CreditCard,
  Star,
  Heart,
  Headphones,
  LogOut,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import RecentOrders from '../../components/account/RecentOrders';
import MaasTip from '../../components/account/MaasTip';

/**
 * ANNAPURNA — Customer Account page.
 *
 * A clean, warm, list-based account hub (mobile-first, spacious on desktop).
 * Every row maps to an EXISTING route / service:
 *   - My Orders        → /orders
 *   - Saved Addresses  → /account/addresses
 *   - Payment Methods  → /account/payment-methods
 *   - Reviews          → home reviews showcase (#reviews)
 *   - Wishlist         → /account/wishlist (honest empty state — not yet implemented)
 *   - Help & Support   → /contact
 *   - Log Out          → existing signOut()
 * Edit Profile continues to open the existing /account/profile/edit flow.
 */

const DIVIDER = { height: '1px', background: 'rgba(93, 64, 55, 0.1)', margin: '20px 0' };

/**
 * A single clean account row: [icon]  Label ............ ›
 * Renders as a Link (`to`) or a button (`onClick`).
 */
function AccountRow({ icon: Icon, label, to, onClick, danger = false, showChevron = true, first = false }) {
  const iconColor = '#B22222';
  const labelColor = danger ? '#B22222' : '#3D2B1F';

  const inner = (
    <>
      <span style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <Icon size={20} strokeWidth={1.9} style={{ flexShrink: 0, color: iconColor }} />
        <span style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '15px',
          fontWeight: danger ? 600 : 500,
          color: labelColor,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </span>
      {showChevron && <ChevronRight size={19} color="#A8816A" style={{ flexShrink: 0 }} />}
    </>
  );

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    width: '100%',
    minHeight: '56px',
    padding: '14px 16px',
    boxSizing: 'border-box',
    borderTop: first ? 'none' : '1px solid rgba(93, 64, 55, 0.08)',
    background: 'transparent',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background 0.18s ease',
    textAlign: 'left',
    fontFamily: "'Be Vietnam Pro', sans-serif",
  };

  const hoverIn = (e) => { e.currentTarget.style.background = 'rgba(93, 64, 55, 0.04)'; };
  const hoverOut = (e) => { e.currentTarget.style.background = 'transparent'; };

  if (to) {
    return (
      <Link to={to} style={rowStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={{ ...rowStyle, border: 'none' }} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
      {inner}
    </button>
  );
}

/** Rounded card wrapper that groups rows with subtle internal dividers. */
function RowCard({ children }) {
  return (
    <div style={{
      background: '#FFFBF7',
      border: '1px solid rgba(93, 64, 55, 0.1)',
      borderRadius: '14px',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();

  // ── Real, authenticated profile data (never hardcoded) ──
  const fullName = user?.user_metadata?.fullName || user?.email?.split('@')[0] || 'there';
  const firstName = fullName.split(' ')[0];
  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const initial = fullName.charAt(0).toUpperCase();

  // Reviews reuses the existing home reviews showcase (#reviews section).
  const goToReviews = () => {
    navigate('/');
    setTimeout(() => {
      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);
  };

  // Existing logout — clearing the session lets ProtectedRoute redirect to /login.
  const handleLogout = async () => {
    await signOut();
  };

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F4', paddingTop: '64px' }}>
      <motion.div
        variants={container}
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 44px) clamp(16px, 4vw, 24px) 56px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Profile header ── */}
        <motion.section variants={item} style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: '#FFC300',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Literata', Georgia, serif",
            fontSize: '32px',
            fontWeight: 600,
            color: '#3D2B1F',
            overflow: 'hidden',
            margin: '0 auto 16px',
            flexShrink: 0,
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initial
            )}
          </div>

          <h1 style={{
            fontFamily: "'Literata', Georgia, serif",
            fontSize: 'clamp(22px, 4vw, 28px)',
            fontWeight: 600,
            color: '#1C1007',
            margin: '0 0 4px',
          }}>
            Hello, {firstName}
          </h1>
          {email && (
            <p style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '14px',
              color: '#7A5C4A',
              margin: '0 0 16px',
              wordBreak: 'break-word',
            }}>
              {email}
            </p>
          )}

          <Link
            to="/account/profile/edit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(178, 34, 34, 0.08)',
              color: '#B22222',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              padding: '9px 20px',
              borderRadius: '24px',
              textDecoration: 'none',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(178, 34, 34, 0.14)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(178, 34, 34, 0.08)')}
          >
            <Pencil size={15} /> Edit Profile
          </Link>
        </motion.section>

        <div style={DIVIDER} />

        {/* ── My Orders + Recent Orders ── */}
        <motion.section variants={item}>
          <RowCard>
            <AccountRow icon={Package} label="My Orders" to="/orders" first />
          </RowCard>
          <div style={{ marginTop: '16px' }}>
           
          </div>
        </motion.section>

        

        {/* ── Core account actions ── */}
        <motion.section variants={item}>
          <RowCard>
            <AccountRow icon={MapPin} label="Saved Addresses" to="/account/addresses" first />
            <AccountRow icon={CreditCard} label="Payment Methods" to="/account/payment-methods" />
            <AccountRow icon={Star} label="Reviews" onClick={goToReviews} />
            <AccountRow icon={Heart} label="Wishlist" to="/account/wishlist" />
          </RowCard>
        </motion.section>

        <div style={DIVIDER} />

        {/* ── Maa's Tips (subtle warm brand touch) ── */}
        <motion.section variants={item}>
          <MaasTip />
        </motion.section>

        <div style={DIVIDER} />

        {/* ── Help & Support + Log Out ── */}
        <motion.section variants={item}>
          <RowCard>
            <AccountRow icon={Headphones} label="Help & Support" to="/contact" first />
            <AccountRow icon={LogOut} label="Log Out" onClick={handleLogout} danger showChevron={false} />
          </RowCard>
        </motion.section>
      </motion.div>
    </div>
  );
}
