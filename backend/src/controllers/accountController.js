/**
 * ANNAPURNA Backend — Account Controller
 *
 * Handles account-level operations that require the service-role key
 * (which must never be exposed to the frontend). The caller's JWT is
 * verified first so a user can only delete their OWN account.
 */

import { supabaseAdmin, verifyUser } from '../config/supabase.js';

function extractBearerToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

/**
 * DELETE /api/account
 * Permanently deletes the authenticated user's account.
 *
 * Order of operations:
 *   1. Snapshot the caller's own Profiles row.
 *   2. Archive that snapshot into `deleted_customers` so the admin
 *      Customers page's historical "Total Customers" count never drops
 *      when an account is deleted (requires the deleted_customers table —
 *      see DATABASE_SCHEMA.md / repo notes for the migration SQL).
 *   3. Hard-delete the Profiles row. If it fails because other rows still
 *      reference it (orders/payments/reviews/etc. with no cascade), fall
 *      back to marking it Status='inactive' instead of blocking the whole
 *      delete flow — and skip the archive insert in that case so the
 *      customer isn't double-counted (still-live row + archived row).
 *   4. Delete the Supabase Auth user (frees the email for reuse).
 */
export async function deleteMyAccount(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorised' });

    const user = await verifyUser(token);

    if (!supabaseAdmin) {
      return res.status(503).json({ success: false, message: 'Account service unavailable' });
    }

    // 1. Snapshot the profile row (best-effort — proceed even if it's missing).
    const { data: profile } = await supabaseAdmin
      .from('Profiles')
      .select('id, full_name, email, phone, role, Status, created_at')
      .eq('id', user.id)
      .maybeSingle();

    // 2 & 3. Try to hard-delete the Profiles row; archive only if that succeeds.
    if (profile) {
      const { error: deleteProfileError } = await supabaseAdmin
        .from('Profiles')
        .delete()
        .eq('id', user.id);

      if (!deleteProfileError) {
        const { error: archiveError } = await supabaseAdmin.from('deleted_customers').insert({
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          role: profile.role,
          status: profile.Status,
          registered_at: profile.created_at,
        });
        if (archiveError) {
          // Non-fatal: the profile is already gone either way, and this is a
          // secondary historical record — log for follow-up, don't block deletion.
          console.error('[AccountController] deleted_customers archive insert failed:', archiveError.message);
        }
      } else if (deleteProfileError.code === '23503') {
        // Foreign-key violation — other rows (orders/payments/etc.) still
        // reference this profile. Keep the row but mark it inactive so it
        // never shows as "Active" again; it still contributes to Total
        // Customers as a live row, so no archive insert is needed.
        const { error: deactivateError } = await supabaseAdmin
          .from('Profiles')
          .update({ Status: 'inactive', Updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (deactivateError) {
          console.error('[AccountController] fallback deactivate failed:', deactivateError.message);
        }
      } else {
        console.error('[AccountController] Profiles delete error:', deleteProfileError.message);
        return res.status(500).json({ success: false, message: 'Failed to delete account' });
      }
    }

    // 4. Delete the Supabase Auth user.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('[AccountController] deleteUser error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to delete account' });
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/account/profile
 * Syncs editable fields (name, phone, avatar, preferences, communication
 * toggles) onto the caller's OWN row in the Profiles table. Customer-facing
 * Supabase RLS does not allow self read/write on Profiles, so this uses the
 * service-role client after verifying the JWT — a user can only ever
 * update their own row (user.id).
 */
export async function updateMyProfileRow(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorised' });

    const user = await verifyUser(token);

    if (!supabaseAdmin) {
      return res.status(503).json({ success: false, message: 'Account service unavailable' });
    }

    const {
      fullName, phone, avatarUrl,
      dateOfBirth, preferredLanguage, customLanguage,
      dietaryPreference, foodAllergies, spicePreference,
      promotionalOffers, newProductNotifications,
      emailNotifications, smsNotifications, whatsappNotifications,
    } = req.body || {};

    const updates = {};
    if (typeof fullName === 'string') updates.full_name = fullName;
    if (typeof phone === 'string') updates.phone = phone;
    if (typeof avatarUrl === 'string') updates.avatar_url = avatarUrl;
    if (typeof dateOfBirth === 'string') updates.date_of_birth = dateOfBirth || null;
    if (typeof preferredLanguage === 'string') updates.preferred_language = preferredLanguage;
    if (typeof customLanguage === 'string') updates.custom_language = customLanguage;
    if (typeof dietaryPreference === 'string') updates.dietary_preference = dietaryPreference;
    if (typeof foodAllergies === 'string') updates.food_allergies = foodAllergies;
    if (typeof spicePreference === 'string') updates.spice_preference = spicePreference;
    if (typeof promotionalOffers === 'boolean') updates.promotional_offers = promotionalOffers;
    if (typeof newProductNotifications === 'boolean') updates.new_product_notifications = newProductNotifications;
    if (typeof emailNotifications === 'boolean') updates.email_notifications = emailNotifications;
    if (typeof smsNotifications === 'boolean') updates.sms_notifications = smsNotifications;
    if (typeof whatsappNotifications === 'boolean') updates.whatsapp_notifications = whatsappNotifications;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const { error } = await supabaseAdmin
      .from('Profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('[AccountController] updateMyProfileRow error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
