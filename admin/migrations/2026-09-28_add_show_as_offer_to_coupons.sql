-- ============================================================================
-- Migration: add "show_as_offer" visibility flag to public.coupons
-- ----------------------------------------------------------------------------
-- Controls whether an active coupon is surfaced to customers in the Checkout
-- "Offers available right now" discovery section. It is INDEPENDENT of
-- is_active: a coupon can be active/applicable by code while hidden from the
-- public offers list (show_as_offer = false), or publicly advertised
-- (show_as_offer = true).
--
-- Default TRUE so existing coupons remain visible as offers (no behaviour
-- change until an admin explicitly hides one).
--
-- Safe to run multiple times.
--
-- HOW TO APPLY: open Supabase Dashboard -> SQL Editor, paste this file, Run.
-- ============================================================================

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS show_as_offer boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.coupons.show_as_offer IS
  'When true, an active coupon appears in the customer Checkout "offers available right now" list. Independent of is_active.';
