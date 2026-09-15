import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfileCard({ user }) {
  // Extract user details
  const fullName = user?.user_metadata?.fullName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'No email provided';
  const phone = user?.user_metadata?.mobile || null; // Will only show if available
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  // Determine avatar initial
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <div style={{
      background: '#FFF8F4',
      border: '1px solid rgba(93, 64, 55, 0.1)',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      height: '100%', // ensure it stretches if used in a grid
      boxSizing: 'border-box'
    }}>
      {/* Top: Avatar and Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#FFC300',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 600,
          color: '#3D2B1F',
          fontFamily: "'Literata', Georgia, serif",
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initial
          )}
        </div>
        <div>
          <h3 style={{
            fontFamily: "'Literata', Georgia, serif",
            fontSize: '20px',
            fontWeight: 600,
            color: '#1C1007',
            margin: 0,
            lineHeight: 1.2
          }}>
            {fullName}
          </h3>
          <span style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '13px',
            color: '#7A5C4A',
            display: 'block',
            marginTop: '4px'
          }}>
            ANNAPURNA Member
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#5D4037' }}>
          <Mail size={16} />
          <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px' }}>
            {email}
          </span>
        </div>
        {phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#5D4037' }}>
            <Phone size={16} />
            <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px' }}>
              {phone}
            </span>
          </div>
        )}
      </div>

      {/* Edit Profile Button */}
      <div style={{ marginTop: 'auto' }}>
        <Link
          to="/account/profile/edit"
          style={{
            display: 'block',
            textAlign: 'center',
            textDecoration: 'none',
            width: '100%',
            background: 'rgba(178, 34, 34, 0.08)',
            color: '#B22222',
            border: 'none',
            padding: '12px',
            borderRadius: '24px',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(178, 34, 34, 0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(178, 34, 34, 0.08)'}
        >
          Edit Profile
        </Link>
      </div>
    </div>
  );
}
