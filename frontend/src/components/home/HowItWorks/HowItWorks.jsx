import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, fadeUp, viewportOnce } from '../../../utils/animations';

const steps = [
  {
    number: '01',
    label: 'Open',
    detail: 'Open the premix packet and get everything ready to cook.',
  },
  {
    number: '02',
    label: 'Mix & Cook',
    detail: 'Follow the simple instructions on the pack, mix with the required ingredients, and cook.',
  },
  {
    number: '03',
    label: 'Serve',
    detail: 'Enjoy a warm, delicious Indian meal in minutes.',
  },
];

const circleVariants = {
  hidden: { opacity: 0, scale: 0.65 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.22, duration: 0.32, ease: [0.4, 0, 0.2, 1] },
  }),
};

// ── Connecting line: draws left-to-right ──
const lineVariants = {
  hidden: { scaleX: 0 },
  visible: (i) => ({
    scaleX: 1,
    transition: { delay: i * 0.22 + 0.18, duration: 0.26, ease: [0.4, 0, 0.2, 1] },
  }),
};

// ── Text below circle: fades up after circle ──
const textVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.22 + 0.24, duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  }),
};

// ── Mobile vertical connector line ──
const vLineVariants = {
  hidden: { scaleY: 0 },
  visible: (i) => ({
    scaleY: 1,
    transition: { delay: i * 0.18 + 0.1, duration: 0.2, ease: 'easeOut' },
  }),
};

// ── Hook: returns true when viewport >= 768px ──
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export default function HowItWorks() {
  const shouldReduce = useReducedMotion();
  const isDesktop = useIsDesktop();

  return (
    <section
      id="how-it-works"
      aria-label="How it works — 4 simple steps"
      style={{
        background: '#FFF8F4',
        padding: 'clamp(60px, 8vw, 100px) 0',
      }}
    >
      <div className="container">

        {/* Section Header */}
        <motion.div
          variants={shouldReduce ? {} : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}
        >
          <motion.p
            variants={shouldReduce ? {} : fadeUp}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: '#B22222',
              marginBottom: '12px',
            }}
          >
            4 Easy Steps
          </motion.p>
          <motion.h2
            variants={shouldReduce ? {} : fadeUp}
            style={{
              fontFamily: "'Literata', Georgia, serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              fontWeight: 500,
              color: '#1C1007',
              lineHeight: 1.2,
            }}
          >
            From packet to plate.
            <br />
            <em style={{ fontStyle: 'italic', color: '#5D4037' }}>Simply.</em>
          </motion.h2>
        </motion.div>

        {/* ── DESKTOP: Horizontal Timeline ── */}
        {isDesktop && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
            }}
          >
            {steps.map((step, i) => (
              <div
                key={step.number}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {/* Track row: half-lines + circle */}
                <div
                  style={{
                    width: '100%',
                    height: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    marginBottom: '16px',
                  }}
                >
                  {/* Left half-line */}
                  {i > 0 && (
                    <motion.div
                      aria-hidden="true"
                      custom={i - 1}
                      variants={shouldReduce ? {} : lineVariants}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: '50%',
                        top: '50%',
                        height: '1.5px',
                        background: 'rgba(178, 34, 34, 0.2)',
                        transformOrigin: 'left center',
                      }}
                    />
                  )}
                  {/* Right half-line */}
                  {i < steps.length - 1 && (
                    <motion.div
                      aria-hidden="true"
                      custom={i}
                      variants={shouldReduce ? {} : lineVariants}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        right: 0,
                        top: '50%',
                        height: '1.5px',
                        background: 'rgba(178, 34, 34, 0.2)',
                        transformOrigin: 'left center',
                      }}
                    />
                  )}
                  {/* Circle — on top of lines */}
                  <motion.div
                    custom={i}
                    variants={shouldReduce ? {} : circleVariants}
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: '#FFF8F4',
                      border: '1.5px solid rgba(178, 34, 34, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 0 0 6px #FFF8F4',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Literata', Georgia, serif",
                        fontSize: '16px',
                        fontWeight: 400,
                        color: '#B22222',
                        lineHeight: 1,
                      }}
                    >
                      {step.number}
                    </span>
                  </motion.div>
                </div>

                {/* Short vertical connector below circle */}
                <div
                  aria-hidden="true"
                  style={{
                    width: '1.5px',
                    height: '20px',
                    background: 'rgba(178, 34, 34, 0.15)',
                    marginBottom: '12px',
                  }}
                />

                {/* Step text */}
                <motion.div
                  custom={i}
                  variants={shouldReduce ? {} : textVariants}
                  style={{ padding: '0 8px' }}
                >
                  <h3
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#1C1007',
                      marginBottom: '8px',
                    }}
                  >
                    {step.label}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '13px',
                      color: '#7A5C4A',
                      lineHeight: 1.65,
                    }}
                  >
                    {step.detail}
                  </p>
                </motion.div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── MOBILE: Vertical Timeline ── */}
        {!isDesktop && (
          <motion.div
            variants={shouldReduce ? {} : staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={shouldReduce ? {} : fadeUp}
                style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                }}
              >
                {/* Left: circle + vertical line */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#FEF4EC',
                      border: '1.5px solid rgba(178, 34, 34, 0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Literata', Georgia, serif",
                        fontSize: '15px',
                        fontWeight: 400,
                        color: '#B22222',
                      }}
                    >
                      {step.number}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <motion.div
                      aria-hidden="true"
                      custom={i}
                      variants={shouldReduce ? {} : vLineVariants}
                      style={{
                        width: '1.5px',
                        height: '44px',
                        background: 'rgba(178, 34, 34, 0.15)',
                        marginTop: '6px',
                        transformOrigin: 'top center',
                      }}
                    />
                  )}
                </div>

                {/* Right: text */}
                <div style={{ paddingTop: '10px', paddingBottom: '16px' }}>
                  <h3
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#1C1007',
                      marginBottom: '5px',
                    }}
                  >
                    {step.label}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '13px',
                      color: '#7A5C4A',
                      lineHeight: 1.65,
                    }}
                  >
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

      </div>
    </section>
  );
}
