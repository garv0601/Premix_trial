/**
 * ANNAPURNA — Shared Auth Layout
 *
 * Two-column layout used by both Login and Sign Up pages.
 * Left: full-height image panel with overlay text.
 * Right: scrollable form panel.
 *
 * Props:
 *  imageUrl       — food image URL for the left panel
 *  overlayTitle   — bold headline over the image (Sign Up only)
 *  overlaySubtitle— body text over the image (Sign Up only)
 *  children       — form content for the right panel
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const IMAGE_URL =
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&q=85&auto=format&fit=crop';

export default function AuthLayout({
  imageUrl = IMAGE_URL,
  overlayTitle,
  overlaySubtitle,
  children,
}) {
  const shouldReduce = useReducedMotion();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr',
        background: '#FFF8F4',
      }}
      id="auth-layout-root"
    >
      {/* ── Left: Image panel (hidden on mobile, shown on md+) ── */}
      <motion.div
        id="auth-image-panel"
        initial={shouldReduce ? {} : { opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'none',      // overridden by media query below
          minHeight: '100vh',
        }}
      >
        {/* Food image */}
        <img
          src={imageUrl}
          alt="Warm Indian home cooking — Annapurna Premix"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />

        {/* Warm gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(28,16,7,0.18) 0%, rgba(28,16,7,0.55) 55%, rgba(28,16,7,0.82) 100%)',
          }}
        />

        {/* Top-left wordmark */}
        <div
          style={{
            position: 'absolute',
            top: '32px',
            left: '36px',
            zIndex: 2,
          }}
        >
          <Link
            to="/"
            style={{
              fontFamily: "'Literata', Georgia, serif",
              fontSize: '20px',
              fontWeight: 600,
              color: '#fff',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            ANNAPURNA
          </Link>
        </div>

        {/* Bottom storytelling text (Sign Up variant) */}
        {(overlayTitle || overlaySubtitle) && (
          <div
            style={{
              position: 'absolute',
              bottom: '48px',
              left: '36px',
              right: '36px',
              zIndex: 2,
            }}
          >
            {overlayTitle && (
              <motion.h2
                initial={shouldReduce ? {} : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                style={{
                  fontFamily: "'Literata', Georgia, serif",
                  fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
                  fontWeight: 500,
                  color: '#fff',
                  lineHeight: 1.22,
                  marginBottom: '12px',
                }}
              >
                {overlayTitle}
              </motion.h2>
            )}
            {overlaySubtitle && (
              <motion.p
                initial={shouldReduce ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.78)',
                  lineHeight: 1.7,
                }}
              >
                {overlaySubtitle}
              </motion.p>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Right: Form panel ── */}
      <div
        id="auth-form-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(32px, 5vw, 60px) clamp(24px, 6vw, 72px)',
          overflowY: 'auto',
          minHeight: '100vh',
        }}
      >
        {/* Mobile-only top section: back link + small visual banner */}
        <div id="auth-mobile-top">
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '13px',
              color: '#7A5C4A',
              textDecoration: 'none',
              marginBottom: '28px',
            }}
          >
            <ArrowLeft size={14} />
            Back to Annapurna
          </Link>

          {/* Mobile image banner */}
          <div
            id="auth-mobile-image"
            style={{
              borderRadius: '14px',
              overflow: 'hidden',
              height: '180px',
              marginBottom: '28px',
              position: 'relative',
            }}
          >
            <img
              src={imageUrl}
              alt="Annapurna"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(28,16,7,0.1), rgba(28,16,7,0.55))',
              }}
            />
          </div>
        </div>

        {children}
      </div>

      {/* Responsive grid */}
      <style>{`
        @media (min-width: 768px) {
          #auth-layout-root { grid-template-columns: 1fr 1fr !important; }
          #auth-image-panel  { display: block !important; }
          #auth-mobile-top   { display: none !important; }
        }
        @media (min-width: 1100px) {
          #auth-layout-root { grid-template-columns: 55% 45% !important; }
        }
      `}</style>
    </div>
  );
}
