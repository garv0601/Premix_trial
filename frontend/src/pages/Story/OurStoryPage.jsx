import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';

// ================================================================
// STORY DATA
// ================================================================
const STORY_MOMENTS = [
  {
    number: '01',
    label: 'The Beginning',
    heading: 'It started in the kitchen.',
    body: 'Long before Annapurna became a brand, it was a feeling. The scent of tempering mustard seeds. The sound of a pressure cooker. The warmth of a home where food was always ready — where someone always cared enough to cook.',
    body2: 'For us, those kitchens are not a distant memory. They are the reason we exist.',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=85&auto=format&fit=crop',
    imageAlt: 'Traditional Indian kitchen filled with warmth and golden light',
    imageLeft: false,
  },
  {
    number: '02',
    label: 'Recipes Worth Keeping',
    heading: 'Some recipes deserve to be passed down.',
    body: 'Every family has recipes that never get written down. Passed through hands, demonstrated once and remembered forever. Cumin ground by hand. Masalas that took an hour to build. These recipes carry more than flavour — they carry history.',
    body2: 'Our mission was simple: honour that knowledge, and make it accessible to everyone.',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85&auto=format&fit=crop',
    imageAlt: 'Close-up of Indian spices — turmeric, cumin, coriander in small clay bowls',
    imageLeft: true,
  },
  {
    number: '03',
    label: 'The Problem',
    heading: "Life became faster. Food shouldn't have to become less meaningful.",
    body: 'Modern life moves quickly. Long commutes, late evenings, exhausted weekends. The first casualty is often dinner — not because people stopped caring, but because time stopped cooperating.',
    body2: "We saw families reaching for instant noodles when they truly wanted dal. We decided something had to change.",
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=85&auto=format&fit=crop',
    imageAlt: 'Busy modern urban kitchen — the contrast between a fast life and traditional cooking',
    imageLeft: false,
  },
  {
    number: '04',
    label: 'Annapurna Is Born',
    heading: 'Making traditional food easier, without taking away its soul.',
    body: "Annapurna — named after the goddess of nourishment — was built on a single belief: you should never have to choose between convenience and authenticity.",
    body2: 'Every premix we craft starts with real spices, real proportions, and real recipes. We do the prep work. You bring the love.',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=85&auto=format&fit=crop',
    imageAlt: 'Annapurna premix packaging alongside freshly ground Indian spices',
    imageLeft: true,
  },
  {
    number: '05',
    label: 'More Than a Premix',
    heading: 'Because food is never just food.',
    body: "A bowl of khichdi on a rainy day. Dal that smells exactly like Nani's. Rotis made with the same flour your mother always used. Food carries memory in a way nothing else can.",
    body2: "Annapurna isn't just selling premixes. We're helping people recreate the feeling of being fed with care.",
    image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=85&auto=format&fit=crop',
    imageAlt: 'Indian family gathered around a table sharing a homemade meal together',
    imageLeft: false,
  },
  {
    number: '06',
    label: 'Today & Beyond',
    heading: 'And this is only the beginning.',
    body: "Today, Annapurna's premixes find their way into kitchens across India — urban apartments, student hostels, small family homes. Each pack carries the same intention it always has.",
    body2: 'More recipes are coming. More traditions are waiting to be preserved. The kitchen never really closes.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=85&auto=format&fit=crop',
    imageAlt: 'Beautiful spread of Indian food — looking toward the future of Annapurna',
    imageLeft: true,
  },
];

// ================================================================
// DECORATIVE — Dot grid
// ================================================================
const DotGrid = ({ style = {} }) => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    aria-hidden="true"
    style={{ position: 'absolute', opacity: 0.25, ...style }}
  >
    {[0, 14, 28, 42, 56, 70].map((x) =>
      [0, 14, 28, 42, 56, 70].map((y) => (
        <circle key={`${x}-${y}`} cx={x + 5} cy={y + 5} r={2} fill="#FFC300" />
      ))
    )}
  </svg>
);

// ================================================================
// STORY HERO
// ================================================================
function StoryHero() {
  const shouldReduce = useReducedMotion();

  return (
    <section
      aria-label="Our story — hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#1C1007',
      }}
    >
      {/* Background image with subtle scale-in */}
      <motion.div
        initial={shouldReduce ? {} : { scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      >
        <img
          src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1600&q=85&auto=format&fit=crop"
          alt="Warm Indian home cooking — the Annapurna story begins here"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
      </motion.div>

      {/* Gradient overlays */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(28,16,7,0.25) 0%, rgba(28,16,7,0.6) 55%, rgba(28,16,7,0.88) 100%)',
        zIndex: 1,
      }} />

      {/* Film grain texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Decorative dots */}
      <DotGrid style={{ bottom: '80px', right: '40px', zIndex: 2 }} />
      <DotGrid style={{ top: '100px', left: '32px', zIndex: 2, opacity: 0.15 }} />

      {/* Hero content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: '0 clamp(24px, 6vw, 80px)',
          maxWidth: '820px',
        }}
      >
        <motion.p
          initial={shouldReduce ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#FFC300',
            marginBottom: '28px',
          }}
        >
          Annapurna · Our Story
        </motion.p>

        <motion.h1
          initial={shouldReduce ? {} : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{
            fontFamily: "'Literata', Georgia, serif",
            fontSize: 'clamp(2.4rem, 7vw, 5rem)',
            fontWeight: 500,
            color: '#fff',
            lineHeight: 1.12,
            marginBottom: '28px',
            letterSpacing: '-0.01em',
          }}
        >
          Every meal begins
          <br />
          <em style={{ fontStyle: 'italic', color: '#FFC300' }}>with a story.</em>
        </motion.h1>

        <motion.p
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'rgba(255,255,255,0.78)',
            lineHeight: 1.72,
            maxWidth: '520px',
            margin: '0 auto 52px',
          }}
        >
          And ours began with the simple belief that good food should never feel far from home.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={shouldReduce ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
        >
          <span style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
          }}>
            Scroll to explore our story ↓
          </span>
          <motion.div
            animate={shouldReduce ? {} : { y: [0, 9, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <ChevronDown size={20} color="rgba(255,255,255,0.4)" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ================================================================
// STORY SECTION — one timeline moment
// ================================================================
function StorySection({ moment, index, onInView }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-28% 0px -28% 0px', once: false });
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (isInView) onInView(index);
  }, [isInView, index, onInView]);

  const textAnim = {
    hidden: shouldReduce ? {} : { opacity: 0, x: moment.imageLeft ? 28 : -28 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.4, 0, 0.2, 1] } },
  };

  const imgAnim = {
    hidden: shouldReduce ? {} : { opacity: 0, y: 36, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.75, ease: [0.4, 0, 0.2, 1] } },
  };

  const labelAnim = {
    hidden: shouldReduce ? {} : { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.05 } },
  };

  return (
    <div
      ref={ref}
      id={`story-section-${index}`}
      style={{ marginBottom: 'clamp(64px, 9vw, 112px)' }}
    >
      {/* Divider label */}
      <motion.div
        variants={labelAnim}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '44px',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'rgba(93,64,55,0.1)' }} />
        <span style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '17px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#B22222',
          whiteSpace: 'nowrap',
        }}>
          {moment.number} — {moment.label}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(93,64,55,0.1)' }} />
      </motion.div>

      {/* Two-column content */}
      <div
        id={`story-cols-${index}`}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'clamp(28px, 5vw, 64px)',
          alignItems: 'center',
        }}
      >
        {/* IMAGE */}
        <motion.div
          variants={imgAnim}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          style={{
            position: 'relative',
            order: moment.imageLeft ? 0 : 1,
          }}
          id={`story-img-${index}`}
          whileHover={shouldReduce ? {} : { scale: 1.025, transition: { duration: 0.35 } }}
        >
          <div style={{
            borderRadius: '18px',
            overflow: 'hidden',
            aspectRatio: '4/3',
            background: '#FEF4EC',
            boxShadow: '0 14px 48px rgba(93, 64, 55, 0.16), 0 4px 12px rgba(93, 64, 55, 0.08)',
            position: 'relative',
          }}>
            <img
              src={moment.image}
              alt={moment.imageAlt}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
            {/* Subtle warm inner shadow */}
            <div style={{
              position: 'absolute',
              inset: 0,
              boxShadow: 'inset 0 0 40px rgba(28,16,7,0.08)',
              borderRadius: '18px',
              pointerEvents: 'none',
            }} />
          </div>
          {/* Decorative accent */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '-12px',
              [moment.imageLeft ? 'right' : 'left']: '-12px',
              width: '65%',
              height: '65%',
              borderRadius: '12px',
              border: '2px solid rgba(255, 195, 0, 0.2)',
              zIndex: -1,
            }}
          />
        </motion.div>

        {/* TEXT */}
        <motion.div
          variants={textAnim}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          style={{ order: moment.imageLeft ? 1 : 0 }}
        >
          <h2 style={{
            fontFamily: "'Literata', Georgia, serif",
            fontSize: 'clamp(1.55rem, 3.2vw, 2.3rem)',
            fontWeight: 500,
            color: '#1C1007',
            lineHeight: 1.22,
            marginBottom: '22px',
          }}>
            {moment.heading}
          </h2>
          <p style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 'clamp(14px, 1.6vw, 16px)',
            color: '#5D4037',
            lineHeight: 1.8,
            marginBottom: '16px',
          }}>
            {moment.body}
          </p>
          {moment.body2 && (
            <p style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 'clamp(14px, 1.6vw, 16px)',
              color: '#7A5C4A',
              lineHeight: 1.8,
              fontStyle: 'italic',
              borderLeft: '3px solid rgba(178, 34, 34, 0.2)',
              paddingLeft: '16px',
            }}>
              {moment.body2}
            </p>
          )}
        </motion.div>
      </div>

      {/* Responsive column styles */}
      <style>{`
        @media (min-width: 768px) {
          #story-cols-${index} { grid-template-columns: 1fr 1fr !important; }
          #story-img-${index} { order: ${moment.imageLeft ? 0 : 1} !important; }
        }
      `}</style>
    </div>
  );
}

// ================================================================
// MEMORY MOMENT — cinematic full-bleed
// ================================================================
function MemoryMoment() {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-20% 0px -20% 0px', once: false });
  const shouldReduce = useReducedMotion();

  const lines = [
    { text: 'Some flavours', italic: false, highlight: false, delay: 0 },
    { text: "don't need an introduction.", italic: true, highlight: false, delay: 0.15 },
    { text: 'They simply remind you', italic: false, highlight: false, delay: 0.3 },
    { text: 'of home.', italic: true, highlight: true, delay: 0.5 },
  ];

  return (
    <section
      ref={ref}
      aria-label="The taste of home — memory moment"
      style={{
        position: 'relative',
        minHeight: 'clamp(380px, 56vh, 580px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: '20px',
        marginBottom: 'clamp(64px, 9vw, 112px)',
      }}
    >
      {/* Background image */}
      <motion.div
        animate={isInView && !shouldReduce ? { scale: 1 } : { scale: 1.06 }}
        transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      >
        <img
          src="https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1400&q=85&auto=format&fit=crop"
          alt="Warm Indian home cooking — the taste of home"
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
      </motion.div>

      {/* Gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(28,16,7,0.48) 0%, rgba(28,16,7,0.72) 100%)',
        zIndex: 1,
      }} />

      {/* Small eyebrow label */}
      <motion.p
        initial={shouldReduce ? {} : { opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0 }}
        style={{
          position: 'absolute',
          top: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,195,0,0.8)',
          zIndex: 2,
          whiteSpace: 'nowrap',
        }}
      >
        The Taste of Home
      </motion.p>

      {/* Lines */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 clamp(24px, 8vw, 100px)' }}>
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={shouldReduce ? {} : { opacity: 0, y: 22 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
            transition={{ duration: 0.75, delay: shouldReduce ? 0 : line.delay, ease: [0.4, 0, 0.2, 1] }}
          >
            <span style={{
              fontFamily: "'Literata', Georgia, serif",
              fontSize: 'clamp(1.9rem, 5vw, 3.8rem)',
              fontWeight: 400,
              color: line.highlight ? '#FFC300' : '#fff',
              lineHeight: 1.28,
              fontStyle: line.italic ? 'italic' : 'normal',
              display: 'block',
            }}>
              {line.text}
            </span>
          </motion.div>
        ))}

        {/* Animated gold line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.9, delay: shouldReduce ? 0 : 0.75, ease: [0.4, 0, 0.2, 1] }}
          style={{
            width: '56px',
            height: '2px',
            background: '#FFC300',
            margin: '28px auto 0',
            transformOrigin: 'center',
          }}
        />
      </div>
    </section>
  );
}

// ================================================================
// PROGRESS NAV
// ================================================================
function ProgressNav({ activeSection, total }) {
  const scrollToSection = useCallback((index) => {
    const el = document.getElementById(`story-section-${index}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <>
      {/* Desktop: vertical pill nav on right edge */}
      <motion.nav
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        aria-label="Story progress navigation"
        id="story-progress-nav"
        style={{
          position: 'fixed',
          right: 'clamp(14px, 2vw, 28px)',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 100,
          padding: '10px 6px',
          background: 'rgba(255,248,244,0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(93,64,55,0.1)',
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToSection(i)}
            aria-label={`Jump to ${STORY_MOMENTS[i]?.label ?? `section ${i + 1}`}`}
            title={STORY_MOMENTS[i]?.label ?? ''}
            style={{
              width: i === activeSection ? 28 : 8,
              height: 8,
              borderRadius: '4px',
              background: i === activeSection ? '#B22222' : 'rgba(93,64,55,0.22)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
              display: 'block',
            }}
          />
        ))}
      </motion.nav>

      {/* Mobile: counter badge */}
      <div
        aria-live="polite"
        id="story-mobile-counter"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '16px',
          background: 'rgba(28,16,7,0.72)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          padding: '6px 14px',
          borderRadius: '20px',
          zIndex: 100,
          display: 'none',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {String(activeSection + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      <style>{`
        @media (max-width: 1023px) {
          #story-progress-nav { display: none !important; }
          #story-mobile-counter { display: block !important; }
        }
      `}</style>
    </>
  );
}

// ================================================================
// FINAL CTA
// ================================================================
function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-15% 0px', once: true });
  const shouldReduce = useReducedMotion();

  return (
    <section
      ref={ref}
      aria-label="Call to action — bring Annapurna home"
      style={{
        position: 'relative',
        minHeight: 'clamp(420px, 52vh, 600px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1400&q=85&auto=format&fit=crop"
          alt="Beautiful Indian food spread — invitation to explore Annapurna"
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(28,16,7,0.55), rgba(28,16,7,0.8))',
        }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 clamp(24px, 6vw, 80px)' }}>
        <motion.p
          initial={shouldReduce ? {} : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#FFC300',
            marginBottom: '20px',
          }}
        >
          And this is only the beginning
        </motion.p>

        <motion.h2
          initial={shouldReduce ? {} : { opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          style={{
            fontFamily: "'Literata', Georgia, serif",
            fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)',
            fontWeight: 500,
            color: '#fff',
            lineHeight: 1.22,
            marginBottom: '44px',
            maxWidth: '600px',
            margin: '0 auto 44px',
          }}
        >
          Now, it's your turn to bring
          <br />
          <em style={{ fontStyle: 'italic', color: '#FFC300' }}>Annapurna home.</em>
        </motion.h2>

        <motion.div
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/shop"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              background: '#B22222',
              color: '#fff',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              padding: '15px 30px',
              borderRadius: '10px',
              textDecoration: 'none',
              boxShadow: '0 6px 24px rgba(178,34,34,0.42)',
              transition: 'background 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#8B1A1A'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#B22222'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Explore Premixes
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              padding: '15px 26px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.22)',
              textDecoration: 'none',
              transition: 'background 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ================================================================
// TIMELINE PROGRESS LINE (decorative, desktop only)
// ================================================================
function TimelineProgressLine({ scrollYProgress, shouldReduce }) {
  const lineHeight = useTransform(scrollYProgress, [0.06, 0.88], ['0%', '100%']);

  return (
    <div
      aria-hidden="true"
      id="timeline-track"
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: '2px',
        background: 'rgba(93,64,55,0.08)',
        transform: 'translateX(-50%)',
        display: 'none',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: shouldReduce ? '100%' : lineHeight,
          background: 'linear-gradient(to bottom, #B22222 0%, #FFC300 100%)',
          borderRadius: '1px',
        }}
      />
    </div>
  );
}

// ================================================================
// MAIN PAGE
// ================================================================
export default function OurStoryPage() {
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: containerRef });

  useEffect(() => {
    document.title = 'ANNAPURNA | Our Story';
    return () => { document.title = 'ANNAPURNA'; };
  }, []);

  const handleSectionInView = useCallback((index) => {
    setActiveSection(index);
  }, []);

  return (
    <div ref={containerRef} style={{ background: '#FFF8F4', overflowX: 'hidden' }}>
      {/* ── Hero ── */}
      <StoryHero />

      {/* ── Timeline body ── */}
      <section
        aria-label="Annapurna story timeline"
        style={{ paddingTop: 'clamp(64px, 9vw, 112px)', position: 'relative' }}
      >
        <div className="container">
          {/* Section intro */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(52px, 7vw, 88px)' }}>
            <motion.p
              initial={shouldReduce ? {} : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#B22222',
                marginBottom: '16px',
              }}
            >
              Our Journey
            </motion.p>
            <motion.h2
              initial={shouldReduce ? {} : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: 0.1 }}
              style={{
                fontFamily: "'Literata', Georgia, serif",
                fontSize: 'clamp(1.8rem, 3.8vw, 2.9rem)',
                fontWeight: 500,
                color: '#1C1007',
                lineHeight: 1.2,
                maxWidth: '560px',
                margin: '0 auto',
              }}
            >
              The story of Annapurna,
              <br />
              <em style={{ fontStyle: 'italic', color: '#5D4037' }}>told one moment at a time.</em>
            </motion.h2>
          </div>

          {/* Timeline track + sections */}
          <div style={{ position: 'relative' }}>
            <TimelineProgressLine scrollYProgress={scrollYProgress} shouldReduce={shouldReduce} />

            {/* First 4 story moments */}
            {STORY_MOMENTS.slice(0, 4).map((moment, i) => (
              <StorySection
                key={moment.number}
                moment={moment}
                index={i}
                onInView={handleSectionInView}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Memory Moment (cinematic interstitial) ── */}
      <div className="container">
        <MemoryMoment />
      </div>

      {/* ── Last 2 story moments ── */}
      <section style={{ paddingBottom: 'clamp(64px, 9vw, 112px)', position: 'relative' }}>
        <div className="container" style={{ position: 'relative' }}>
          {STORY_MOMENTS.slice(4).map((moment, i) => (
            <StorySection
              key={moment.number}
              moment={moment}
              index={i + 4}
              onInView={handleSectionInView}
            />
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <FinalCTA />

      {/* ── Progress nav ── */}
      <ProgressNav activeSection={activeSection} total={STORY_MOMENTS.length} />

      {/* Timeline desktop show */}
      <style>{`
        @media (min-width: 768px) {
          #timeline-track { display: block !important; }
        }
      `}</style>
    </div>
  );
}
