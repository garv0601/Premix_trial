import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { staggerContainer, fadeUp, imageReveal, viewportOnce } from '../../../utils/animations';

export default function StoryPreview() {
  return (
    <section
      id="story"
      aria-label="Our story"
      style={{
        background: '#FFF8F4',
        padding: 'clamp(60px, 8vw, 100px) 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'clamp(36px, 6vw, 70px)',
          alignItems: 'center',
        }}
        id="story-grid"
      >
        {/* LEFT: Image */}
        <motion.div
          variants={imageReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          style={{ position: 'relative' }}
        >
          <div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '4/3',
              background: '#FEF4EC',
              boxShadow: '0 12px 40px rgba(93, 64, 55, 0.14)',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=700&q=85&auto=format&fit=crop"
              alt="Indian kitchen — warm, traditional home cooking environment"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </div>
          {/* Subtle decorative accent */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '-14px',
              right: '-14px',
              width: '70%',
              height: '70%',
              borderRadius: '12px',
              border: '2px solid rgba(255, 195, 0, 0.25)',
              zIndex: -1,
            }}
          />
        </motion.div>

        {/* RIGHT: Copy */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#B22222',
              marginBottom: '16px',
            }}
          >
            Our Story
          </motion.p>

          <motion.h2
            variants={fadeUp}
            style={{
              fontFamily: "'Literata', Georgia, serif",
              fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)',
              fontWeight: 500,
              color: '#1C1007',
              lineHeight: 1.25,
              marginBottom: '20px',
            }}
          >
            Food is more than a meal.
            <br />
            <em style={{ fontStyle: 'italic', color: '#5D4037' }}>
              It is how we care for one another.
            </em>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 'clamp(14px, 1.6vw, 16px)',
              color: '#5D4037',
              lineHeight: 1.75,
              marginBottom: '14px',
            }}
          >
            Annapurna is rooted in the Indian tradition of feeding, nourishing and
            bringing people together. We believe that traditional food should not be
            complicated or time-consuming — it should be accessible to every household,
            every day.
          </motion.p>

          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 'clamp(14px, 1.6vw, 16px)',
              color: '#5D4037',
              lineHeight: 1.75,
              marginBottom: '30px',
            }}
          >
            Our premixes are crafted with that simple idea — to keep the warmth and
            flavour of homemade Indian food within reach, however busy life becomes.
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link
              to="/story"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#B22222',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(178, 34, 34, 0.3)',
                paddingBottom: '2px',
                transition: 'color 0.18s',
              }}
            >
              Read our story
              <ArrowRight size={15} />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 860px) {
          #story-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
