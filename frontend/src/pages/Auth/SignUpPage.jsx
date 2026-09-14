import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Phone, User, Loader2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { buildAuthRedirectUrl } from '../../services/auth';

const SIGNUP_IMAGE = 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=900&q=85&auto=format&fit=crop';

export default function SignUpPage() {
  const [step, setStep] = useState('FORM'); // 'FORM' | 'CHOICE' | 'OTP'
  const [method, setMethod] = useState(''); // 'email' | 'phone'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: ''
  });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { signInWithGoogle, signInWithFacebook, sendAuthOtp, verifyAuthOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Please enter your full name.';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.mobile.trim() || !/^[6-9]\d{9}$/.test(formData.mobile.replace(/\s+/g, '').replace(/^\+91/, ''))) {
      newErrors.mobile = 'Please enter a valid 10-digit Indian mobile number.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('CHOICE');
    }
  };

  const handleSendOtp = async (selectedMethod) => {
    setMethod(selectedMethod);
    setIsSubmitting(true);
    setErrors({});
    
    const identifier = selectedMethod === 'email' ? formData.email : formData.mobile;
    const { error } = await sendAuthOtp(selectedMethod, identifier, formData);
    
    setIsSubmitting(false);

    if (error) {
      if (error.code === 'not_configured') {
        navigate(redirectPath);
      } else {
        setErrors({ general: error.message || 'Failed to send code. Please try again.' });
      }
    } else {
      setSuccessMessage(`We've sent a code to your ${selectedMethod === 'email' ? 'email' : 'phone'}.`);
      setStep('OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrors({ otp: 'Please enter the code.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    const identifier = method === 'email' ? formData.email : formData.mobile;
    const { error } = await verifyAuthOtp(method, identifier, otp);
    
    setIsSubmitting(false);

    if (error) {
      setErrors({ general: error.message || 'Invalid code. Please try again.' });
    } else {
      navigate(redirectPath);
    }
  };

  const handleSocial = async (provider) => {
    setErrors({});
    const action = provider === 'google' ? signInWithGoogle : signInWithFacebook;
    const { error } = await action(buildAuthRedirectUrl(redirectPath));
    if (error) {
      if (error.code === 'not_configured') {
        navigate(redirectPath);
      } else {
        setErrors({ general: error.message || `Failed to sign up with ${provider}.` });
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px 14px 44px',
    background: '#FFFFFF',
    border: '1px solid rgba(93, 64, 55, 0.15)',
    borderRadius: '8px',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: '15px',
    color: '#3D2B1F',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const buttonStyle = {
    width: '100%',
    padding: '15px 24px',
    background: '#B22222',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: '15px',
    fontWeight: 600,
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background 0.2s ease',
  };

  const socialButtonStyle = {
    width: '100%',
    padding: '13px 24px',
    background: '#FFFFFF',
    border: '1px solid rgba(93, 64, 55, 0.15)',
    borderRadius: '8px',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    color: '#3D2B1F',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s ease',
  };

  return (
    <AuthLayout 
      imageUrl={SIGNUP_IMAGE}
      overlayTitle="Ghar Jaisa Swad"
      overlaySubtitle="Experience the warmth and unpretentious comfort of a mother's kitchen with every meal."
    >
      <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
        
        {/* ── HEADER ── */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: "'Literata', Georgia, serif", fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 500, color: '#1C1007', marginBottom: '12px', lineHeight: 1.2 }}>
            {step === 'FORM' ? 'Join the Annapurna family.' : step === 'CHOICE' ? 'Verify your account' : 'Enter Verification Code'}
          </h1>
          <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#7A5C4A', lineHeight: 1.6 }}>
            {step === 'FORM' && 'Start your journey to homemade flavors in minutes.'}
            {step === 'CHOICE' && 'How would you like to verify your account?'}
            {step === 'OTP' && successMessage}
          </p>
        </div>

        {/* ── STEP 1: FORM ── */}
        {step === 'FORM' && (
          <motion.form initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleFormSubmit} style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037', marginBottom: '6px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A8816A' }}><User size={18} /></div>
                  <input type="text" name="fullName" placeholder="e.g. Rahul Sharma" value={formData.fullName} onChange={(e) => { setFormData(prev => ({ ...prev, fullName: e.target.value })); setErrors(prev => ({ ...prev, fullName: '' })); }} style={inputStyle} />
                </div>
                {errors.fullName && <div style={{ color: '#B22222', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} />{errors.fullName}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037', marginBottom: '6px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A8816A' }}><Mail size={18} /></div>
                  <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); setErrors(prev => ({ ...prev, email: '' })); }} style={inputStyle} />
                </div>
                {errors.email && <div style={{ color: '#B22222', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} />{errors.email}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037', marginBottom: '6px' }}>Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A8816A' }}><Phone size={18} /></div>
                  <input type="tel" name="mobile" placeholder="+91 XXXXX XXXXX" value={formData.mobile} onChange={(e) => { setFormData(prev => ({ ...prev, mobile: e.target.value })); setErrors(prev => ({ ...prev, mobile: '' })); }} style={inputStyle} />
                </div>
                {errors.mobile && <div style={{ color: '#B22222', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} />{errors.mobile}</div>}
              </div>
            </div>

            <button type="submit" style={buttonStyle}>Continue →</button>
          </motion.form>
        )}

        {/* ── STEP 2: CHOICE ── */}
        {step === 'CHOICE' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <button onClick={() => handleSendOtp('email')} disabled={isSubmitting} style={{ ...socialButtonStyle, padding: '16px', justifyContent: 'flex-start' }}>
              <Mail size={20} color="#B22222" />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1C1007' }}>Verify via Email</div>
                <div style={{ fontSize: '13px', color: '#7A5C4A', fontWeight: 400 }}>Send a link to {formData.email}</div>
              </div>
            </button>

            <button onClick={() => handleSendOtp('phone')} disabled={isSubmitting} style={{ ...socialButtonStyle, padding: '16px', justifyContent: 'flex-start' }}>
              <Phone size={20} color="#B22222" />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1C1007' }}>Verify via SMS</div>
                <div style={{ fontSize: '13px', color: '#7A5C4A', fontWeight: 400 }}>Send OTP to {formData.mobile}</div>
              </div>
            </button>

            {errors.general && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B22222', fontSize: '13px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                <AlertCircle size={14} /><span>{errors.general}</span>
              </div>
            )}

            <button onClick={() => { setStep('FORM'); setErrors({}); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#A8816A', fontSize: '14px', cursor: 'pointer', padding: 0, marginTop: '8px' }}>
              <ArrowLeft size={14} /> Back to details
            </button>
          </motion.div>
        )}

        {/* ── STEP 3: OTP ── */}
        {step === 'OTP' && (
          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleVerifyOtp} style={{ marginBottom: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037', marginBottom: '8px' }}>Verification Code</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A8816A' }}><KeyRound size={18} /></div>
                <input type="text" placeholder="Enter 6-digit code" value={otp} onChange={(e) => { setOtp(e.target.value); setErrors({}); }} style={inputStyle} />
              </div>
              {errors.otp && <div style={{ color: '#B22222', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} />{errors.otp}</div>}
              {errors.general && <div style={{ color: '#B22222', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} />{errors.general}</div>}
            </div>

            <button type="submit" disabled={isSubmitting} style={buttonStyle}>
              {isSubmitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : 'Verify & Sign In'}
            </button>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => setStep('CHOICE')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#A8816A', fontSize: '14px', cursor: 'pointer', padding: 0 }}>
                <ArrowLeft size={14} /> Choose different method
              </button>
              <button type="button" onClick={() => handleSendOtp(method)} disabled={isSubmitting} style={{ background: 'none', border: 'none', color: '#B22222', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                Resend Code
              </button>
            </div>
          </motion.form>
        )}

        {/* ── SOCIAL & LOGIN LINK (Only show on FORM step) ── */}
        {step === 'FORM' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(93, 64, 55, 0.1)' }} />
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', fontWeight: 600, color: '#A8816A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>OR SIGN UP WITH</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(93, 64, 55, 0.1)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
              <button type="button" onClick={() => handleSocial('google')} style={socialButtonStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button type="button" onClick={() => handleSocial('facebook')} style={socialButtonStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: '#7A5C4A' }}>Already have an account? </span>
              <Link to={`/login?redirect=${encodeURIComponent(redirectPath)}`} style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', fontWeight: 600, color: '#B22222', textDecoration: 'none' }}>Log In</Link>
            </div>
          </motion.div>
        )}

      </div>
    </AuthLayout>
  );
}
