import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';

/**
 * ANNAPURNA — Wishlist page.
 *
 * A dedicated wishlist feature is not yet implemented in the app, so this
 * page intentionally shows an honest empty state instead of fabricating
 * saved products. It keeps the Account navigation consistent and stays
 * ready for a real wishlist implementation later.
 */
export default function WishlistPage() {
  useEffect(() => {
    document.title = 'Wishlist — ANNAPURNA';
    return () => { document.title = 'ANNAPURNA'; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F4', paddingTop: '64px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 48px' }}>
        <Link
          to="/account"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            color: '#5D4037',
            textDecoration: 'none',
            marginBottom: '24px',
          }}
        >
          <ArrowLeft size={18} /> Back to Account
        </Link>

        <h1 style={{
          fontFamily: "'Literata', Georgia, serif",
          fontSize: 'clamp(24px, 4vw, 32px)',
          fontWeight: 600,
          color: '#1C1007',
          margin: '0 0 28px',
        }}>
          Wishlist
        </h1>

        <div style={{
          background: '#FFFBF7',
          border: '1px solid rgba(93, 64, 55, 0.1)',
          borderRadius: '16px',
          padding: 'clamp(32px, 6vw, 56px) 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(178, 34, 34, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#B22222',
            margin: '0 auto 20px',
          }}>
            <Heart size={28} strokeWidth={1.8} />
          </div>
          <h2 style={{
            fontFamily: "'Literata', Georgia, serif",
            fontSize: '20px',
            fontWeight: 600,
            color: '#1C1007',
            margin: '0 0 8px',
          }}>
            Your wishlist is empty
          </h2>
          <p style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '15px',
            color: '#7A5C4A',
            lineHeight: 1.6,
            margin: '0 auto 24px',
            maxWidth: '360px',
          }}>
            Browse our premixes and save your favourites here so you never lose track of what you love.
          </p>
          <Link
            to="/shop"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#B22222',
              color: '#FFF',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              padding: '12px 22px',
              borderRadius: '24px',
              textDecoration: 'none',
            }}
          >
            <ShoppingBag size={18} /> Explore Premixes
          </Link>
        </div>
      </div>
    </div>
  );
}
