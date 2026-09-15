import React from 'react';

const footerLinks = {
  shop: [
    { label: 'All Premixes', href: '/shop' },
    { label: 'Popular Premixes', href: '/shop' },
  ],
  about: [
    { label: 'Our Story', href: '#story' },
    { label: 'Reviews', href: '#reviews' },
    { label: 'Contact', href: '/contact' },
  ],
  help: [
    { label: 'Shipping', href: '/shipping' },
    { label: 'Order Tracking', href: '/tracking' },
    { label: 'FAQs', href: '/faq' },
    { label: 'WhatsApp Support', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
  ],
};

function FooterColumn({ heading, links }) {
  return (
    <div>
      <h3
        style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#3D2B1F',
          marginBottom: '16px',
        }}
      >
        {heading}
      </h3>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {links.map((l) => (
          <li key={l.href + l.label}>
            <a
              href={l.href}
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '14px',
                color: '#7A5C4A',
                textDecoration: 'none',
                transition: 'color 0.18s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B22222')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#7A5C4A')}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      id="contact"
      style={{
        background: '#1C1007',
        color: '#FFF8F4',
        padding: 'clamp(48px, 7vw, 80px) 0 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'clamp(28px, 4vw, 48px)',
          marginBottom: 'clamp(40px, 6vw, 60px)',
          alignItems: 'start',
        }}
      >
        {/* Brand Column */}
        <div style={{ gridColumn: '1 / -1', maxWidth: '320px' }} id="footer-brand">
          <span
            style={{
              fontFamily: "'Literata', Georgia, serif",
              fontSize: '22px',
              fontWeight: 600,
              color: '#FFC300',
              letterSpacing: '0.04em',
              display: 'block',
              marginBottom: '14px',
            }}
          >
            ANNAPURNA
          </span>
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '14px',
              color: 'rgba(255, 248, 244, 0.55)',
              lineHeight: 1.7,
              maxWidth: '280px',
            }}
          >
            Bringing the warmth, nutrition and unmistakable taste of traditional Indian
            food to your table, every day.
          </p>
        </div>

        <FooterColumn heading="Shop" links={footerLinks.shop} />
        <FooterColumn heading="About" links={footerLinks.about} />
        <FooterColumn heading="Help" links={footerLinks.help} />
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 248, 244, 0.08)',
          padding: 'clamp(16px, 3vw, 24px) 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '13px',
              color: 'rgba(255, 248, 244, 0.4)',
            }}
          >
            © {new Date().getFullYear()} Annapurna. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {footerLinks.legal.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '12px',
                  color: 'rgba(255, 248, 244, 0.4)',
                  textDecoration: 'none',
                  transition: 'color 0.18s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 248, 244, 0.75)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 248, 244, 0.4)')}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          #footer-brand {
            grid-column: 1 !important;
            max-width: 280px;
          }
        }
      `}</style>
    </footer>
  );
}
