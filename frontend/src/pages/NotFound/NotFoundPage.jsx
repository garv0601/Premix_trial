import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CookingPot, Home, UtensilsCrossed } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../utils/animations';
import './NotFoundPage.css';

/* Scattered floating spice-dot particles behind the 404 card.
   Fixed positions/colors/delays keep the render deterministic. */
const PARTICLES = [
  { left: '8%', size: 10, color: '#B22222', delay: 0 },
  { left: '18%', size: 7, color: '#FFC300', delay: 1.4 },
  { left: '28%', size: 12, color: '#2F8B57', delay: 0.6 },
  { left: '42%', size: 8, color: '#B22222', delay: 2.2 },
  { left: '58%', size: 9, color: '#FFC300', delay: 0.3 },
  { left: '70%', size: 11, color: '#2F8B57', delay: 1.8 },
  { left: '82%', size: 7, color: '#B22222', delay: 1.1 },
  { left: '92%', size: 10, color: '#FFC300', delay: 2.6 },
];

/**
 * ANNAPURNA — 404 fallback page.
 * Shown for unmatched routes (catch-all "*" route in App.jsx) via a
 * lighthearted, on-brand "recipe not found" animation. Pure UI —
 * no data fetching, no interaction with cart/auth/checkout state.
 */
export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page Not Found — ANNAPURNA';
    return () => { document.title = 'ANNAPURNA'; };
  }, []);

  return (
    <div className="notfound-page">
      <div className="notfound-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="notfound-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              background: p.color,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        className="notfound-card"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="notfound-digits" variants={fadeUp}>
          <span className="notfound-digit">4</span>
          <span className="notfound-pot-wrap" aria-hidden="true">
            <span className="notfound-steam notfound-steam-1" />
            <span className="notfound-steam notfound-steam-2" />
            <span className="notfound-steam notfound-steam-3" />
            <CookingPot className="notfound-pot" strokeWidth={1.6} />
          </span>
          <span className="notfound-digit">4</span>
        </motion.div>

        <motion.p className="notfound-eyebrow" variants={fadeUp}>
          Error 404 · Recipe Not Found
        </motion.p>

        <motion.h1 className="notfound-title" variants={fadeUp}>
          Oops! This page got lost in the kitchen.
        </motion.h1>

        <motion.p className="notfound-subtitle" variants={fadeUp}>
          The page you're looking for has been misplaced, moved, or never
          existed — much like a premix packet with no label. Let's get you
          back to something delicious.
        </motion.p>

        <motion.div className="notfound-actions" variants={fadeUp}>
          <Link to="/" className="notfound-btn notfound-btn-primary">
            <Home size={18} />
            Back to Home
          </Link>
          <Link to="/shop" className="notfound-btn notfound-btn-outline">
            <UtensilsCrossed size={18} />
            Browse Shop
          </Link>
        </motion.div>

        <motion.p className="notfound-hint" variants={fadeUp}>
          Looking for something specific? Try <code>/shop</code> or{' '}
          <code>/account</code>.
        </motion.p>
      </motion.div>
    </div>
  );
}
