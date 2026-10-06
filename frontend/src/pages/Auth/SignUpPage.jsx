import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Phone, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { buildAuthRedirectUrl } from '../../services/auth';
import { BASE_URL } from '../../services/api';
import supabase from '../../lib/supabase';

const SIGNUP_IMAGE = 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=900&q=85&auto=format&fit=crop';

const OtpInput = ({ value, onChange, onVerify, onResend, loading, error, contactType, countdown }) => {
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) return;

    const newOtp = value.split('');
    newOtp[index] = val;
    const combined = newOtp.join('');
    onChange(combined);

    if (val && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1].focus();
    } else if (e.key === 'Enter' && value.length === 6) {
      onVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      if (pasted.length === 6) {
        inputs.current[5]?.focus();
      } else {
        inputs.current[pasted.length]?.focus();
      }
    }
  };

  const otpArray = value.padEnd(6, ' ').split('');

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      style={{ overflow: 'hidden', marginTop: '12px' }}
    >
      <div style={{ background: '#FFFDF9', border: '1px solid #EADDD7', borderRadius: '8px', padding: '16px' }}>
        <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', color: '#5D4037', marginBottom: '12px', textAlign: 'center' }}>
          Enter the 6-digit OTP sent to your {contactType}
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
          {otpArray.map((digit, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit.trim()}
              onChange={e => handleChange(e, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              onPaste={handlePaste}
              style={{
                width: '40px',
                height: '46px',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 600,
                border: '1px solid #A8816A',
                borderRadius: '6px',
                color: '#3D2B1F',
                outline: 'none',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                backgroundColor: '#fff'
              }}
              onFocus={e => e.target.style.borderColor = '#B22222'}
              onBlur={e => e.target.style.borderColor = '#A8816A'}
            />
          ))}
        </div>

        {error && (
          <div style={{ color: '#B22222', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          type="button"
          onClick={onVerify}
          disabled={loading || value.length < 6}
          style={{
            width: '100%',
            padding: '10px',
            background: value.length === 6 && !loading ? '#B22222' : '#DAB8AA',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            cursor: value.length === 6 && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px',
            transition: 'background 0.2s ease'
          }}
        >
          {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : 'Verify'}
        </button>

        <div style={{ textAlign: 'center' }}>
          {countdown > 0 ? (
            <span style={{ fontSize: '12px', color: '#7A5C4A', fontFamily: "'Be Vietnam Pro', sans-serif" }}>Resend in {countdown} sec</span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              style={{ background: 'none', border: 'none', color: '#B22222', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              Didn't receive the OTP? Resend
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  
  const [emailState, setEmailState] = useState({ value: '', isVerified: false, showOtp: false, otp: '', loading: false, error: '', countdown: 0 });
  const [mobileState, setMobileState] = useState({ value: '', isVerified: false, showOtp: false, otp: '', loading: false, error: '', countdown: 0 });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const { sendAuthOtp, verifyAuthOtp, signInWithGoogle, signInWithFacebook, updateProfile, syncProfileRow, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  // Countdowns
  useEffect(() => {
    let emailTimer;
    if (emailState.countdown > 0) {
      emailTimer = setTimeout(() => setEmailState(prev => ({ ...prev, countdown: prev.countdown - 1 })), 1000);
    }
    return () => clearTimeout(emailTimer);
  }, [emailState.countdown]);

  useEffect(() => {
    let mobileTimer;
    if (mobileState.countdown > 0) {
      mobileTimer = setTimeout(() => setMobileState(prev => ({ ...prev, countdown: prev.countdown - 1 })), 1000);
    }
    return () => clearTimeout(mobileTimer);
  }, [mobileState.countdown]);

  const validateEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobileFormat = (mobile) => /^[6-9]\d{9}$/.test(mobile.replace(/\s+/g, '').replace(/^\+91/, ''));

  const handleSendOtp = async (method) => {
    const isEmail = method === 'email';
    const state = isEmail ? emailState : mobileState;
    const setState = isEmail ? setEmailState : setMobileState;
    const value = state.value;

    if (!fullName.trim()) {
      setErrors({ fullName: 'Please enter your name before verifying.' });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '', showOtp: true }));
    
    let resultError = null;

    if (isEmail) {
      try {
        const res = await fetch(`${BASE_URL}/auth/email/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value })
        });
        const data = await res.json();
        if (!res.ok) resultError = { message: data.error || 'Failed to send OTP.' };
      } catch (err) {
        resultError = { message: 'Network error sending OTP.' };
      }
    } else {
      if (user) {
        const phone = value.startsWith('+') ? value : `+91${value}`;
        const { error } = await supabase.auth.updateUser({ phone });
        resultError = error;
      } else {
        const metadata = { fullName };
        if (emailState.value) metadata.email = emailState.value;
        const { error } = await sendAuthOtp(method, value, metadata);
        resultError = error;
      }
    }

    setState(prev => ({ ...prev, loading: false }));

    if (resultError) {
      if (resultError.code === 'not_configured') {
        navigate(redirectPath);
      } else {
        setState(prev => ({ ...prev, error: resultError.message || 'Failed to send OTP.' }));
      }
    } else {
      setState(prev => ({ ...prev, countdown: 30 }));
    }
  };

  const handleVerifyOtp = async (method) => {
    const isEmail = method === 'email';
    const state = isEmail ? emailState : mobileState;
    const setState = isEmail ? setEmailState : setMobileState;
    const value = state.value;
    const otp = state.otp;

    setState(prev => ({ ...prev, loading: true, error: '' }));

    let resultError = null;

    if (isEmail) {
      try {
        const res = await fetch(`${BASE_URL}/auth/email/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value, otp })
        });
        const data = await res.json();
        if (!res.ok) resultError = { message: data.error || 'Invalid code.' };
      } catch (err) {
        resultError = { message: 'Network error verifying OTP.' };
      }
    } else {
      if (user) {
        const phone = value.startsWith('+') ? value : `+91${value}`;
        const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'phone_change' });
        resultError = error;
      } else {
        const { error } = await verifyAuthOtp(method, value, otp);
        resultError = error;
      }
    }

    setState(prev => ({ ...prev, loading: false }));

    if (resultError) {
      setState(prev => ({ ...prev, error: resultError.message || 'Invalid code.' }));
    } else {
      setState(prev => ({ ...prev, isVerified: true, showOtp: false, error: '' }));
      setErrors({});
    }
  };

  const handleCreateAccount = async () => {
    if (!fullName.trim()) {
      setErrors({ fullName: 'Please enter your full name.' });
      return;
    }
    if (!emailState.isVerified && !mobileState.isVerified) {
      setGeneralError('Please verify at least one contact method.');
      return;
    }

    setIsSubmitting(true);
    setGeneralError('');

    // If Email is verified via Resend, we must finalize it on the backend.
    if (emailState.isVerified) {
      try {
        const res = await fetch(`${BASE_URL}/auth/email/finalize-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailState.value,
            fullName,
            mobile: mobileState.isVerified ? mobileState.value : undefined,
            userId: user?.id
          })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setGeneralError(data.error || 'Failed to finalize email signup.');
          setIsSubmitting(false);
          return;
        }

        // If it generated a password for a brand new account, sign them in
        if (data.password) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
          });
          if (signInErr) {
            setGeneralError(signInErr.message);
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        setGeneralError('Network error finalizing signup.');
        setIsSubmitting(false);
        return;
      }
    }

    const metadata = { full_name: fullName };
    if (mobileState.value && mobileState.isVerified) metadata.mobile = mobileState.value;

    const { error: profileError } = await updateProfile(metadata);
    await syncProfileRow({ fullName, phone: mobileState.isVerified ? mobileState.value : undefined });

    setIsSubmitting(false);

    if (profileError) {
      setGeneralError(profileError.message);
    } else {
      navigate(redirectPath);
    }
  };

  const handleSocial = async (provider) => {
    setGeneralError('');
    const action = provider === 'google' ? signInWithGoogle : signInWithFacebook;
    const { error } = await action(buildAuthRedirectUrl(redirectPath));
    if (error) {
      if (error.code === 'not_configured') {
        navigate(redirectPath);
      } else {
        setGeneralError(error.message || `Failed to sign up with ${provider}.`);
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
    cursor: 'pointer',
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

  const canSubmit = fullName.trim() && (emailState.isVerified || mobileState.isVerified);

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
            Join the Annapurna family.
          </h1>
          <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#7A5C4A', lineHeight: 1.6 }}>
            Start your journey to homemade flavors in minutes.
          </p>
        </div>

        {/* ── FORM ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {/* Username */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037', marginBottom: '6px' }}>
              <span>Full Name</span>
              <span style={{ color: '#B22222', fontSize: '11px' }}>Required</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A8816A' }}><User size={18} /></div>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: '' })); }}
                style={inputStyle}
              />
            </div>
            {errors.fullName && <div style={{ color: '#B22222', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} />{errors.fullName}</div>}
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037', marginBottom: '6px' }}>Email Address</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: emailState.isVerified ? '#34A853' : '#A8816A' }}><Mail size={18} /></div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={emailState.value}
                  onChange={(e) => setEmailState(prev => ({ ...prev, value: e.target.value, isVerified: false, showOtp: false }))}
                  style={{ ...inputStyle, paddingRight: '16px', borderColor: emailState.isVerified ? '#34A853' : 'rgba(93, 64, 55, 0.15)' }}
                />
              </div>
              {emailState.isVerified ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0 16px', background: '#E6F4EA', color: '#137333', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Verified
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp('email')}
                  disabled={!validateEmailFormat(emailState.value) || emailState.loading || emailState.countdown > 0}
                  style={{
                    padding: '0 16px',
                    background: validateEmailFormat(emailState.value) ? '#B22222' : '#F1E9E6',
                    color: validateEmailFormat(emailState.value) ? '#FFF' : '#A8816A',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: validateEmailFormat(emailState.value) && !emailState.loading && emailState.countdown === 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '100px',
                    transition: 'background 0.2s ease, color 0.2s ease'
                  }}
                >
                  {emailState.loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Verify OTP'}
                </button>
              )}
            </div>
            <AnimatePresence>
              {emailState.showOtp && !emailState.isVerified && (
                <OtpInput
                  value={emailState.otp}
                  onChange={(val) => setEmailState(prev => ({ ...prev, otp: val, error: '' }))}
                  onVerify={() => handleVerifyOtp('email')}
                  onResend={() => handleSendOtp('email')}
                  loading={emailState.loading}
                  error={emailState.error}
                  contactType="email"
                  countdown={emailState.countdown}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Mobile */}
          <div>
            <label style={{ display: 'block', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037', marginBottom: '6px' }}>Mobile Number</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: mobileState.isVerified ? '#34A853' : '#A8816A' }}><Phone size={18} /></div>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={mobileState.value}
                  onChange={(e) => setMobileState(prev => ({ ...prev, value: e.target.value, isVerified: false, showOtp: false }))}
                  style={{ ...inputStyle, paddingRight: '16px', borderColor: mobileState.isVerified ? '#34A853' : 'rgba(93, 64, 55, 0.15)' }}
                />
              </div>
              {mobileState.isVerified ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0 16px', background: '#E6F4EA', color: '#137333', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Verified
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp('phone')}
                  disabled={!validateMobileFormat(mobileState.value) || mobileState.loading || mobileState.countdown > 0}
                  style={{
                    padding: '0 16px',
                    background: validateMobileFormat(mobileState.value) ? '#B22222' : '#F1E9E6',
                    color: validateMobileFormat(mobileState.value) ? '#FFF' : '#A8816A',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: validateMobileFormat(mobileState.value) && !mobileState.loading && mobileState.countdown === 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '100px',
                    transition: 'background 0.2s ease, color 0.2s ease'
                  }}
                >
                  {mobileState.loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Verify OTP'}
                </button>
              )}
            </div>
            <AnimatePresence>
              {mobileState.showOtp && !mobileState.isVerified && (
                <OtpInput
                  value={mobileState.otp}
                  onChange={(val) => setMobileState(prev => ({ ...prev, otp: val, error: '' }))}
                  onVerify={() => handleVerifyOtp('phone')}
                  onResend={() => handleSendOtp('phone')}
                  loading={mobileState.loading}
                  error={mobileState.error}
                  contactType="mobile"
                  countdown={mobileState.countdown}
                />
              )}
            </AnimatePresence>
          </div>

        </div>

        {generalError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B22222', fontSize: '13px', fontFamily: "'Be Vietnam Pro', sans-serif", marginBottom: '16px' }}>
            <AlertCircle size={14} /><span>{generalError}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleCreateAccount}
          disabled={!canSubmit || isSubmitting}
          style={{ ...buttonStyle, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed' }}
        >
          {isSubmitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating Account...</> : 'Create Account'}
        </button>

        {/* ── SOCIAL & LOGIN LINK ── */}
        <div style={{ marginTop: '28px' }}>
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(93, 64, 55, 0.1)' }} />
            <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', fontWeight: 600, color: '#A8816A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>OR SIGN UP WITH</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(93, 64, 55, 0.1)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
            <button type="button" onClick={() => handleSocial('google')} style={socialButtonStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Google
            </button>
            <button type="button" onClick={() => handleSocial('facebook')} style={socialButtonStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              Facebook
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: '#7A5C4A' }}>Already have an account? </span>
            <Link to={`/login?redirect=${encodeURIComponent(redirectPath)}`} style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', fontWeight: 600, color: '#B22222', textDecoration: 'none' }}>Log In</Link>
          </div>
        </div>

      </div>
    </AuthLayout>
  );
}
