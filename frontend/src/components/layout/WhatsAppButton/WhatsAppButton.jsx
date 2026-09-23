import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const WA_HREF = 'https://wa.me/918209042370';

export default function WhatsAppButton({ hideTooltipOnMobile = false }) {
  const shouldReduce = useReducedMotion();

  return (
    <div
      id="wa-float"
      className={hideTooltipOnMobile ? 'wa-float-compact' : ''}
      style={{
        position: 'fixed',
        bottom: 'clamp(20px, 3vw, 30px)',
        right: 'clamp(16px, 3vw, 28px)',
        zIndex: 1100,
      }}
    >
      {hideTooltipOnMobile && (
        // Scoped, mobile-only: the "Need help?" chip and the button crowd each
        // other on narrow screens, so the redundant chip is hidden there while
        // the button (with its own accessible label) still works everywhere.
        <style>{`
          .wa-float-compact { bottom: calc(94px + env(safe-area-inset-bottom, 0px)) !important; }
          @media (max-width: 480px) {
            .wa-float-compact .wa-tooltip { display: none; }
          }
        `}</style>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Tooltip */}
        <span
          className="wa-tooltip"
          aria-hidden="true"
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            color: '#1C1007',
            background: '#FFF8F4',
            border: '1px solid rgba(93, 64, 55, 0.12)',
            borderRadius: '6px',
            padding: '6px 11px',
            boxShadow: '0 2px 8px rgba(93, 64, 55, 0.10)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          Need help?
        </span>

        <motion.a
          id="whatsapp-support-btn"
          href={WA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact Annapurna support on WhatsApp"
          title="Chat with us on WhatsApp"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
            textDecoration: 'none',
            flexShrink: 0,
          }}
          whileHover={shouldReduce ? {} : { scale: 1.1 }}
          whileTap={shouldReduce ? {} : { scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        >
          <MessageCircle size={24} color="#ffffff" fill="#ffffff" strokeWidth={1.5} />
        </motion.a>
      </div>
    </div>
  );
}
