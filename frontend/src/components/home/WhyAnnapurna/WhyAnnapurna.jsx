import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp, viewportOnce } from '../../../utils/animations';

const reasons = [
  {
    number: '01',
    title: 'Made for Everyday Life',
    body: 'Quick preparation for busy mornings and evenings — without sacrificing flavour or nourishment.',
    accent: '#B22222',
  },
  {
    number: '02',
    title: 'Rooted in Indian Flavours',
    body: 'Inspired by familiar recipes and traditional tastes that feel like a meal cooked at home.',
    accent: '#FFC300',
  },
  {
    number: '03',
    title: 'Simple to Prepare',
    body: 'Less measuring. Less preparation. More time for conversation, family and the things that matter.',
    accent: '#2F8B57',
  },
  {
    number: '04',
    title: 'Made with Care',
    body: 'A brand built around food, nourishment and the feeling of home — for ordinary Indian households.',
    accent: '#B22222',
  },
];

export default function WhyAnnapurna() {
  return (
    <section
      id="why-annapurna"
      aria-label="Why choose Annapurna?"
      style={{
        background: '#FEF4EC',
        padding: 'clamp(60px, 8vw, 100px) 0',
      }}
    >
      <div className="container">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          style={{ maxWidth: '560px', marginBottom: 'clamp(40px, 6vw, 64px)' }}
        >
          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: '#2F8B57',
              marginBottom: '12px',
            }}
          >
            Our Promise
          </motion.p>
          <motion.h2
            variants={fadeUp}
            style={{
              fontFamily: "'Literata', Georgia, serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              fontWeight: 500,
              color: '#1C1007',
              lineHeight: 1.2,
              marginBottom: '14px',
            }}
          >
            Why Annapurna?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '15px',
              color: '#7A5C4A',
              lineHeight: 1.7,
            }}
          >
            Because everyday food should be simple, comforting and full of flavour.
          </motion.p>
        </motion.div>

        {/* Reasons Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'clamp(20px, 3vw, 30px)',
          }}
          id="why-grid"
        >
          {reasons.map((r) => (
            <motion.div
              key={r.number}
              variants={fadeUp}
              style={{
                background: '#FFFBF7',
                border: '1px solid rgba(93, 64, 55, 0.1)',
                borderRadius: '12px',
                padding: 'clamp(22px, 3vw, 32px)',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily: "'Literata', Georgia, serif",
                  fontSize: '34px',
                  fontWeight: 300,
                  color: r.accent,
                  opacity: 0.35,
                  lineHeight: 1,
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {r.number}
              </span>
              <div>
                <h3
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#1C1007',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {r.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '14px',
                    color: '#7A5C4A',
                    lineHeight: 1.65,
                  }}
                >
                  {r.body}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          #why-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          #why-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}
