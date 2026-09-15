import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../utils/animations';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Product Question',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'ANNAPURNA | Contact Us';
    return () => { document.title = 'ANNAPURNA'; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again or contact us on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div style={{ paddingTop: 'clamp(80px, 10vw, 120px)', background: '#FFF8F4' }}>
        <div className="container">
          
          {/* 1. CONTACT HERO */}
          <section style={{ marginBottom: 'clamp(60px, 8vw, 80px)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
              gap: 'clamp(32px, 5vw, 64px)',
              alignItems: 'center'
            }}>
              {/* Left Text */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <span style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#B22222',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '16px'
                }}>
                  We're here to help
                </span>
                <h1 style={{
                  fontFamily: "'Literata', Georgia, serif",
                  fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                  fontWeight: 500,
                  color: '#1C1007',
                  lineHeight: 1.15,
                  marginBottom: '24px'
                }}>
                  Let's talk about your next meal.
                </h1>
                <p style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 'clamp(15px, 1.8vw, 18px)',
                  color: '#7A5C4A',
                  lineHeight: 1.6,
                  maxWidth: '480px'
                }}>
                  Have a question about our premixes, your order, or just want to say hello? We'd love to hear from you.
                </p>
              </motion.div>

              {/* Right Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 24px 48px rgba(93, 64, 55, 0.08)'
                }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80&auto=format&fit=crop" 
                  alt="Warm Indian meal preparation" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </motion.div>
            </div>
          </section>

          {/* Main Content Area */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
            gap: 'clamp(40px, 6vw, 80px)',
            paddingBottom: 'clamp(60px, 10vw, 100px)'
          }}>
            
            {/* 2. CONTACT FORM */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
            >
              <h2 style={{
                fontFamily: "'Literata', Georgia, serif",
                fontSize: '28px',
                fontWeight: 600,
                color: '#1C1007',
                marginBottom: '8px'
              }}>
                How can we help?
              </h2>
              <p style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '15px',
                color: '#7A5C4A',
                marginBottom: '32px'
              }}>
                Send us a message and our team will get back to you.
              </p>

              {isSuccess ? (
                <div style={{
                  background: '#FEF4EC',
                  border: '1px solid #F3D5C0',
                  borderRadius: '16px',
                  padding: '40px 32px',
                  textAlign: 'center'
                }}>
                  <CheckCircle2 size={48} color="#2F8B57" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{
                    fontFamily: "'Literata', Georgia, serif",
                    fontSize: '22px',
                    fontWeight: 600,
                    color: '#1C1007',
                    marginBottom: '12px'
                  }}>
                    Message received! ❤️
                  </h3>
                  <p style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '15px',
                    color: '#7A5C4A',
                    lineHeight: 1.6,
                    marginBottom: '24px'
                  }}>
                    Thanks for reaching out to ANNAPURNA. We've received your message and will get back to you soon.
                  </p>
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setFormData(prev => ({ ...prev, message: '' }));
                    }}
                    style={{
                      background: 'transparent',
                      border: '1.5px solid #B22222',
                      color: '#B22222',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(178, 34, 34, 0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#3D2B1F' }}>Full Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid rgba(93, 64, 55, 0.15)', background: '#fff', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#1C1007', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={(e) => (e.target.style.borderColor = '#B22222')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(93, 64, 55, 0.15)')}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#3D2B1F' }}>Email Address *</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid rgba(93, 64, 55, 0.15)', background: '#fff', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#1C1007', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={(e) => (e.target.style.borderColor = '#B22222')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(93, 64, 55, 0.15)')}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#3D2B1F' }}>Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid rgba(93, 64, 55, 0.15)', background: '#fff', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#1C1007', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={(e) => (e.target.style.borderColor = '#B22222')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(93, 64, 55, 0.15)')}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#3D2B1F' }}>Subject *</label>
                    <select 
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid rgba(93, 64, 55, 0.15)', background: '#fff', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#1C1007', outline: 'none', transition: 'border-color 0.2s', cursor: 'pointer' }}
                      onFocus={(e) => (e.target.style.borderColor = '#B22222')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(93, 64, 55, 0.15)')}
                    >
                      <option>Order Support</option>
                      <option>Product Question</option>
                      <option>Payment Issue</option>
                      <option>Delivery Question</option>
                      <option>Feedback</option>
                      <option>Other</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#3D2B1F' }}>Message *</label>
                    <textarea 
                      name="message"
                      required
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid rgba(93, 64, 55, 0.15)', background: '#fff', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#1C1007', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical' }}
                      onFocus={(e) => (e.target.style.borderColor = '#B22222')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(93, 64, 55, 0.15)')}
                    ></textarea>
                  </div>

                  {error && (
                    <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: '#B22222', background: 'rgba(178, 34, 34, 0.05)', padding: '12px 16px', borderRadius: '8px' }}>
                      {error}
                    </div>
                  )}
                  
                  <div style={{ marginTop: '8px' }}>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        background: '#B22222',
                        color: '#fff',
                        border: 'none',
                        padding: '16px 24px',
                        borderRadius: '10px',
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.8 : 1,
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#8B1A1A')}
                      onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = '#B22222')}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                    <p style={{
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '13px',
                      color: '#A8816A',
                      textAlign: 'center',
                      marginTop: '12px'
                    }}>
                      We'll get back to you as soon as possible.
                    </p>
                  </div>
                </form>
              )}
            </motion.div>

            {/* 3 & 4. CONTACT INFORMATION & WHATSAPP SUPPORT */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
            >
              <div>
                <h3 style={{
                  fontFamily: "'Literata', Georgia, serif",
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#1C1007',
                  marginBottom: '20px'
                }}>
                  Reach us directly
                </h3>
                
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid rgba(93, 64, 55, 0.08)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone size={20} color="#B22222" />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#7A5C4A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Phone Support</div>
                      <a href="tel:+918209042370" style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '16px', fontWeight: 500, color: '#1C1007', textDecoration: 'none' }}>+91 8209042370</a>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid rgba(93, 64, 55, 0.08)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={20} color="#B22222" />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#7A5C4A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Email Support</div>
                      {/* Placeholder email, to be replaced via config later */}
                      <a href="mailto:support@annapurna.com" style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '16px', fontWeight: 500, color: '#1C1007', textDecoration: 'none' }}>support@annapurna.com</a>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* WhatsApp Support CTA */}
              <motion.div variants={fadeUp} style={{
                background: '#FEF4EC',
                border: '1px solid #F3D5C0',
                borderRadius: '20px',
                padding: '32px 24px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 24px rgba(37, 211, 102, 0.25)'
                }}>
                  <MessageCircle size={28} color="#fff" fill="#fff" />
                </div>
                <h3 style={{
                  fontFamily: "'Literata', Georgia, serif",
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#1C1007',
                  marginBottom: '10px'
                }}>
                  Need a quick answer?
                </h3>
                <p style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '15px',
                  color: '#7A5C4A',
                  lineHeight: 1.6,
                  marginBottom: '24px'
                }}>
                  Chat with us on WhatsApp for quick help with your order or products.
                </p>
                <a
                  href="https://wa.me/918209042370"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#25D366',
                    color: '#fff',
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '15px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.2)';
                  }}
                >
                  Chat on WhatsApp
                  <ArrowRight size={18} />
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
