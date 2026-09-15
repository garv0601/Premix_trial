import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Soup, Minus } from 'lucide-react';
import { staggerContainer, fadeUp, slideRight, viewportOnce } from '../../../utils/animations';

const benefits = [
  {
    icon: Clock,
    iconColor: '#B22222',
    label: 'Ready to Cook',
    description: 'Easy preparation for everyday meals — morning, noon and evening.',
  },
  {
    icon: Soup,
    iconColor: '#2F8B57',
    label: 'Traditional Flavours',
    description: 'Inspired by familiar Indian recipes from home kitchens across the country.',
  },
  {
    icon: Minus,
    iconColor: '#FFC300',
    label: 'Less Preparation',
    description: 'Less chopping, measuring and mixing so you can focus on what matters.',
  },
];

export default function PremixExplanation() {
  return (
    <section
      id="about-premix"
      aria-label="What is a premix?"
      style={{
        background: '#FEF4EC',
        padding: 'clamp(60px, 8vw, 100px) 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'clamp(40px, 6vw, 70px)',
          alignItems: 'center',
        }}
        id="premix-grid"
      >
        {/* LEFT: Heading block */}
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
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: '#2F8B57',
              marginBottom: '14px',
            }}
          >
            What is an Annapurna Premix?
          </motion.p>

          <motion.h2
            variants={fadeUp}
            style={{
              fontFamily: "'Literata', Georgia, serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 500,
              color: '#1C1007',
              lineHeight: 1.2,
              marginBottom: '20px',
            }}
          >
            All the goodness.
            <br />
            Less of the preparation.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 'clamp(14px, 1.6vw, 16px)',
              color: '#5D4037',
              lineHeight: 1.75,
              maxWidth: '440px',
            }}
          >
            Annapurna premixes bring together carefully prepared ingredients so you can enjoy
            familiar Indian favourites without spending hours measuring, mixing and cooking, as everything is prepared with dry ingredients.
          </motion.p>
        </motion.div>

        {/* RIGHT: Benefits */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
        >
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.label}
                variants={fadeUp}
                style={{
                  display: 'flex',
                  gap: '18px',
                  alignItems: 'flex-start',
                  paddingBottom: '28px',
                  borderBottom: i < benefits.length - 1 ? '1px solid rgba(93, 64, 55, 0.1)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(255, 248, 244, 0.9)',
                    border: `1.5px solid ${b.iconColor}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={b.iconColor} strokeWidth={1.8} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#1C1007',
                      marginBottom: '5px',
                    }}
                  >
                    {b.label}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '14px',
                      color: '#7A5C4A',
                      lineHeight: 1.6,
                    }}
                  >
                    {b.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 860px) {
          #premix-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
