import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';

/**
 * ANNAPURNA — About page.
 * A concise brand/mission page, distinct from the narrative "Our Story".
 * Styling intentionally mirrors the existing warm-ivory site language.
 */

const VALUES = [
  {
    icon: Leaf,
    title: 'Real Ingredients',
    body: 'Every premix begins with real spices in real proportions — never shortcuts, never fillers.',
  },
  {
    icon: HeartHandshake,
    title: 'Made With Care',
    body: 'We do the prep so you can bring the love. Home-style food, without the hours of work.',
  },
  {
    icon: Sparkles,
    title: 'Authentic Taste',
    body: 'Recipes passed down through generations, crafted to taste exactly the way you remember.',
  },
];

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About — ANNAPURNA';
    return () => { document.title = 'ANNAPURNA'; };
  }, []);

  return (
    <div style={{ paddingTop: 'clamp(80px, 10vw, 120px)', paddingBottom: 'clamp(60px, 8vw, 90px)', background: '#FFF8F4' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <p style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#B22222',
          marginBottom: '14px',
        }}>
          About Annapurna
        </p>

        <h1 style={{
          fontFamily: "'Literata', Georgia, serif",
          fontSize: 'clamp(30px, 5vw, 46px)',
          fontWeight: 600,
          color: '#1C1007',
          lineHeight: 1.15,
          marginBottom: '20px',
        }}>
          Traditional food, made effortless.
        </h1>

        <p style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: 'clamp(16px, 2.4vw, 18px)',
          color: '#5D4037',
          lineHeight: 1.75,
          marginBottom: '18px',
        }}>
          Annapurna — named after the goddess of nourishment — exists for a single belief: you
          should never have to choose between convenience and authenticity. We bring the warmth,
          nutrition and unmistakable taste of traditional Indian food to your table, every day.
        </p>

        <p style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: 'clamp(16px, 2.4vw, 18px)',
          color: '#5D4037',
          lineHeight: 1.75,
          marginBottom: 'clamp(36px, 6vw, 56px)',
        }}>
          Each premix we craft starts with real spices, real proportions and real recipes. We do
          the careful prep work so that a wholesome, home-style meal is only minutes away.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: 'clamp(40px, 6vw, 60px)',
        }}>
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div key={title} style={{
              background: '#FFFBF7',
              border: '1px solid rgba(93, 64, 55, 0.1)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(178, 34, 34, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B22222',
                marginBottom: '16px',
              }}>
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <h3 style={{
                fontFamily: "'Literata', Georgia, serif",
                fontSize: '18px',
                fontWeight: 600,
                color: '#1C1007',
                marginBottom: '8px',
              }}>
                {title}
              </h3>
              <p style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '14px',
                color: '#7A5C4A',
                lineHeight: 1.65,
              }}>
                {body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
          <Link to="/shop" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#B22222',
            color: '#FFF',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '15px',
            fontWeight: 600,
            padding: '13px 22px',
            borderRadius: '10px',
            textDecoration: 'none',
          }}>
            Explore Premixes <ArrowRight size={18} />
          </Link>
          <Link to="/story" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            color: '#5D4037',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '15px',
            fontWeight: 600,
            padding: '13px 22px',
            borderRadius: '10px',
            border: '1.5px solid rgba(93, 64, 55, 0.2)',
            textDecoration: 'none',
          }}>
            Read Our Story
          </Link>
        </div>
      </div>
    </div>
  );
}
