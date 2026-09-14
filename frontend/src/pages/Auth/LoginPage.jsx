import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Phone, Loader2, AlertCircle, KeyRound, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { buildAuthRedirectUrl } from '../../services/auth';

const LOGIN_IMAGE = 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900&q=85&auto=format&fit=crop';

/** Map raw Supabase auth errors to friendly, user-facing copy. */
function friendlyAuthError(err) {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Incorrect email or password. Please try again.';
  if (msg.includes('email not confirmed')) return 'Please confirm your email address before logging in.';
  return err?.message || 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const [step, setStep] = useState('FORM'); // 'FORM' | 'OTP'
  const [inputValue, setInputValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [method, setMethod] = useState(''); // 'email' | 'phone'
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const { signIn, signInWithGoogle, signInWithFacebook, sendAuthOtp, verifyAuthOtp, resetPasswordForEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  // Email + password login (works for password users and Google users who set a password).
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const email = inputValue.trim();
    if (!email || !email.includes('@')) {
      setError('Please enter your email address to log in with a password.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const { error: authError } = await signIn(email, password);
    setIsSubmitting(false);

    if (authError) {
      if (authError.code === 'not_configured') {
        navigate(redirectPath);
      } else {
        setError(friendlyAuthError(authError));
      }
    } else {
      navigate(redirectPath);
    }
  };

  // Send a password-reset email for the address in the identifier field.
  const handleForgotPassword = async () => {
    setError('');
    setInfoMessage('');

    const email = inputValue.trim();
    if (!email || !email.includes('@')) {
      setError('Enter your email address above, then tap "Forgot password?" to receive a reset link.');
      return;
    }

    setIsSubmitting(true);
    const { error: authError } = await resetPasswordForEmail(email);
    setIsSubmitting(false);

    if (authError && authError.code !== 'not_configured') {
      setError(authError.message || 'Failed to send reset email. Please try again.');
    } else {
      setInfoMessage(`If an account exists for ${email}, a password reset link is on its way.`);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!inputValue.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }

    const isEmail = inputValue.includes('@');
    const selectedMethod = isEmail ? 'email' : 'phone';
    
    if (!isEmail && !/^[6-9]\d{9}$/.test(inputValue.replace(/\s+/g, '').replace(/^\+91/, ''))) {
      setError('Please enter a valid email or 10-digit mobile number.');
      return;
    }

    setMethod(selectedMethod);
    setOtpSending(true);

    const { error: authError } = await sendAuthOtp(selectedMethod, inputValue, {});

    setOtpSending(false);

    if (authError) {
      if (authError.code === 'not_configured') {
        navigate(redirectPath);
      } else {
        setError(authError.message || 'Failed to send code. Please try again.');
      }
    } else {
      setSuccessMessage(`We've sent a code to your ${selectedMethod === 'email' ? 'email' : 'phone'}.`);
      setStep('OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    setIsSubmitting(true);

    const { error: authError } = await verifyAuthOtp(method, inputValue, otp);

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message || 'Invalid code. Please try again.');
    } else {
      navigate(redirectPath);
    }
  };

  const handleSocial = async (provider) => {
    setError('');
    const action = provider === 'google' ? signInWithGoogle : signInWithFacebook;
    const { error: authError } = await action(buildAuthRedirectUrl(redirectPath));
    if (authError) {
      if (authError.code === 'not_configured') {
        navigate(redirectPath);
      } else {
        setError(authError.message || `Failed to sign in with ${provider}.`);
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
    <AuthLayout imageUrl={LOGIN_IMAGE}>
      <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
        
        {/* ── HEADER ── */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: "'Literata', Georgia, serif", fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 500, color: '#1C1007', marginBottom: '12px', lineHeight: 1.2 }}>
            {step === 'FORM' ? 'Welcome to the Annapurna family' : 'Enter Verification Code'}
          </h1>
          <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#7A5C4A', lineHeight: 1.6 }}>
            {step === 'FORM' && 'Experience the comfort of "Ghar Jaisa" meals. Log in or sign up to continue.'}
            {step === 'OTP' && successMessage}
          </p>
        </div>

        {/* ── STEP 1: FORM ── */}
        {step === 'FORM' && (
          <motion.form initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handlePasswordLogin} style={{ marginBottom: '32px' }}>
            <div style={{ marginBottom: '18px', position: 'relative' }}>
              <label style={{ display: 'block', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037', marginBottom: '8px' }}>Mobile Number or Email</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A8816A' }}><Mail size={18} /></div>
                <input type="text" placeholder="Enter your details" value={inputValue} onChange={(e) => { setInputValue(e.target.value); setError(''); setInfoMessage(''); }} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037' }}>Password</label>
                <button type="button" onClick={handleForgotPassword} disabled={isSubmitting} style={{ background: 'none', border: 'none', color: '#B22222', fontSize: '13px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', padding: 0, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A8816A' }}><Lock size={18} /></div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); setInfoMessage(''); }}
                  style={{ ...inputStyle, paddingRight: '44px' }}
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#A8816A', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 10 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B22222', fontSize: '13px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                    <AlertCircle size={14} /><span>{error}</span>
                  </motion.div>
                )}
                {infoMessage && (
                  <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 10 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2F8B57', fontSize: '13px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                    <CheckCircle2 size={14} /><span>{infoMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button type="submit" disabled={isSubmitting} style={buttonStyle}>
              {isSubmitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Logging in...</> : 'Log In'}
            </button>

            <div style={{ marginTop: '12px' }}>
              <button type="button" onClick={handleSendOtp} disabled={otpSending} style={{ ...socialButtonStyle, cursor: otpSending ? 'not-allowed' : 'pointer' }}>
                {otpSending ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending code...</> : <><KeyRound size={16} /> Email me a one-time code instead</>}
              </button>
            </div>
          </motion.form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 'OTP' && (
          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleVerifyOtp} style={{ marginBottom: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5D4037', marginBottom: '8px' }}>Verification Code</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A8816A' }}><KeyRound size={18} /></div>
                <input type="text" placeholder="Enter 6-digit code" value={otp} onChange={(e) => { setOtp(e.target.value); setError(''); }} style={inputStyle} />
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B22222', fontSize: '13px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                    <AlertCircle size={14} /><span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button type="submit" disabled={isSubmitting} style={buttonStyle}>
              {isSubmitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : 'Verify & Sign In'}
            </button>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => { setStep('FORM'); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#A8816A', fontSize: '14px', cursor: 'pointer', padding: 0 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="button" onClick={handleSendOtp} disabled={otpSending} style={{ background: 'none', border: 'none', color: '#B22222', fontSize: '14px', fontWeight: 600, cursor: otpSending ? 'not-allowed' : 'pointer', padding: 0 }}>
                Resend Code
              </button>
            </div>
          </motion.form>
        )}

        {/* ── SOCIAL & SIGNUP LINK (Only show on FORM step) ── */}
        {step === 'FORM' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(93, 64, 55, 0.1)' }} />
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', fontWeight: 600, color: '#A8816A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>OR CONTINUE WITH</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(93, 64, 55, 0.1)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
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
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: '#7A5C4A' }}>Don't have an account? </span>
              <Link to={`/signup?redirect=${encodeURIComponent(redirectPath)}`} style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', fontWeight: 600, color: '#B22222', textDecoration: 'none' }}>Create Account</Link>
            </div>
          </motion.div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </AuthLayout>
  );
}
