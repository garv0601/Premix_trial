import { Router } from 'express';
import { Resend } from 'resend';
import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';

const router = Router();

// Retrieve Resend configuration from environment
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const resendFromName = process.env.RESEND_FROM_NAME || 'Annapurna Premix';

let resend;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  console.warn('[Warning] RESEND_API_KEY is not set. Email OTPs will not actually be sent.');
}

// In-memory store for OTPs (Key: email, Value: { otp: string, expiresAt: number, attempts: number })
// Note: In a production, multi-instance backend, use Redis or a DB instead.
const otpStore = new Map();

// In-memory store for resend rate-limiting (Key: email, Value: { nextAvailable: number })
const rateLimitStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;

// Generate a secure 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/email/send-otp
 * Body: { email: string }
 */
router.post('/email/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const now = Date.now();

  // 1. Rate limiting check
  const rateLimit = rateLimitStore.get(email);
  if (rateLimit && now < rateLimit.nextAvailable) {
    const waitSeconds = Math.ceil((rateLimit.nextAvailable - now) / 1000);
    return res.status(429).json({ error: `Please wait ${waitSeconds}s before requesting a new OTP.` });
  }

  // 2. Generate new OTP
  const otp = generateOtp();
  
  // Store it securely in memory (DO NOT return to frontend)
  otpStore.set(email, {
    otp,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0
  });

  // Set cooldown
  rateLimitStore.set(email, {
    nextAvailable: now + OTP_COOLDOWN_MS
  });

  // 3. Send email using Resend
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${resendFromName} <${resendFromEmail}>`,
        to: email,
        subject: 'Your Annapurna Premix Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify your Email</h2>
            <p>Your 6-digit verification code is:</p>
            <h1 style="letter-spacing: 5px; color: #B22222;">${otp}</h1>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      });

      if (error) {
        console.error('[Resend Error]', error);
        return res.status(500).json({ error: 'Failed to send OTP email.' });
      }
    } catch (err) {
      console.error('[Resend Exception]', err);
      return res.status(500).json({ error: 'Failed to send OTP email.' });
    }
  } else {
    // If no Resend API key, just log it for dev
    console.log(`[Dev OTP] To: ${email} | Code: ${otp}`);
  }

  res.json({ message: 'OTP sent successfully' });
});

/**
 * POST /api/auth/email/verify-otp
 * Body: { email: string, otp: string }
 */
router.post('/email/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const record = otpStore.get(email);
  if (!record) {
    return res.status(400).json({ error: 'No active OTP found. Please request a new one.' });
  }

  const now = Date.now();

  // 1. Check expiry
  if (now > record.expiresAt) {
    otpStore.delete(email); // Cleanup
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  // 2. Check attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
  }

  // Increment attempts
  record.attempts += 1;

  // 3. Verify OTP
  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Incorrect OTP. Please check the code and try again.' });
  }

  // Success! Clean up the store
  otpStore.delete(email);
  rateLimitStore.delete(email); // Clear cooldown so they don't get blocked on next unrelated action

  // In this implementation, verifying the email OTP just confirms the email ownership.
  // We return a simple success and track that it's verified so finalize-signup can check it.
  verifiedEmails.set(email, { verifiedAt: now });
  res.json({ message: 'Email verified successfully', verified: true, email });
});

const verifiedEmails = new Map();

/**
 * POST /api/auth/email/finalize-signup
 * Creates a Supabase user for a verified email
 */
router.post('/email/finalize-signup', async (req, res) => {
  const { email, fullName, mobile, userId } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email and fullName are required' });
  }

  const record = verifiedEmails.get(email);
  if (!record) {
    return res.status(403).json({ error: 'Email has not been verified.' });
  }

  // If user already has a session (e.g. verified mobile first), just link the email
  if (userId) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true
    });
    if (error) {
      console.error('[Supabase Link Error]', error);
      return res.status(500).json({ error: 'Failed to link email to existing account.' });
    }
    verifiedEmails.delete(email);
    return res.json({ success: true, email });
  }

  // Generate a random secure password for the new user since they are passwordless
  const password = crypto.randomBytes(16).toString('hex') + 'A1!';

  // Create or update the user in Supabase
  let authError = null;
  
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, mobile: mobile || '' }
  });

  if (createError) {
    if (createError.message.toLowerCase().includes('already exists')) {
      // User already exists, update their password so we can log them in, and ensure email is confirmed
      // We need to fetch their ID first
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData.users.find(u => u.email === email);
      
      if (existingUser) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, mobile: mobile || existingUser.user_metadata?.mobile || '' }
        });
        authError = updateError;
      } else {
        authError = createError;
      }
    } else {
      authError = createError;
    }
  }

  if (authError) {
    console.error('[Supabase Finalize Error]', authError);
    return res.status(500).json({ error: 'Failed to create user account in database.' });
  }

  // Cleanup
  verifiedEmails.delete(email);

  res.json({ email, password });
});

export const authRouter = router;
