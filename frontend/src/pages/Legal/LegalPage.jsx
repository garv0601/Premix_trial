import React, { useEffect } from 'react';

/**
 * ANNAPURNA — shared presentational shell for simple legal/info pages
 * (Privacy Policy, Terms & Conditions). Keeps styling consistent with
 * the warm-ivory site language without duplicating layout markup.
 */
export default function LegalPage({ eyebrow, title, updated, sections = [], docTitle }) {
  useEffect(() => {
    if (docTitle) document.title = docTitle;
    return () => { document.title = 'ANNAPURNA'; };
  }, [docTitle]);

  return (
    <div style={{ paddingTop: 'clamp(80px, 10vw, 120px)', paddingBottom: 'clamp(60px, 8vw, 90px)', background: '#FFF8F4' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        {eyebrow && (
          <p style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#B22222',
            marginBottom: '14px',
          }}>
            {eyebrow}
          </p>
        )}

        <h1 style={{
          fontFamily: "'Literata', Georgia, serif",
          fontSize: 'clamp(28px, 4.6vw, 42px)',
          fontWeight: 600,
          color: '#1C1007',
          lineHeight: 1.15,
          marginBottom: updated ? '10px' : 'clamp(28px, 5vw, 40px)',
        }}>
          {title}
        </h1>

        {updated && (
          <p style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '14px',
            color: '#7A5C4A',
            marginBottom: 'clamp(28px, 5vw, 40px)',
          }}>
            {updated}
          </p>
        )}

        {sections.map((s) => (
          <section key={s.heading} style={{ marginBottom: 'clamp(24px, 4vw, 32px)' }}>
            <h2 style={{
              fontFamily: "'Literata', Georgia, serif",
              fontSize: 'clamp(19px, 2.6vw, 22px)',
              fontWeight: 600,
              color: '#1C1007',
              marginBottom: '10px',
            }}>
              {s.heading}
            </h2>
            <p style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '15px',
              color: '#5D4037',
              lineHeight: 1.75,
            }}>
              {s.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
