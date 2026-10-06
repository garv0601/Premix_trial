-- ============================================================================
-- ANNAPURNA — Row Level Security (RLS) AUDIT + HARDENING REFERENCE
-- ============================================================================
-- Created for the pre-launch security audit.
--
-- WHY THIS MATTERS (read first):
--   Both the customer frontend (frontend/) and the admin frontend
--   (admin/frontend/) talk to Supabase DIRECTLY using the PUBLIC anon key,
--   which is embedded in the browser bundle and therefore known to everyone.
--   For these tables, Row Level Security policies are the ONLY thing stopping
--   a logged-in customer (or anyone with the anon key) from reading/writing
--   data they should not. Examples that rely on RLS:
--     - Admin writes: products, coupons, categories, admin_notifications,
--       admin_activity_logs   (must be admin-only via is_admin())
--     - Customer data: addresses, Profiles, orders, order_items, payments,
--       reviews, notifications (each row must be owner-scoped to auth.uid())
--
--   The Node backend uses the SERVICE-ROLE key (bypasses RLS) and is safe;
--   this file is ONLY about the direct-from-browser access paths.
--
-- HOW TO USE:
--   1. Run SECTION 1 (read-only) in the Supabase SQL editor. Nothing is
--      changed — it just reports the current state.
--   2. Compare the results against SECTION 2 (the expected model).
--   3. If a table is missing RLS or the right policies, adapt SECTION 3
--      (currently commented out) AFTER review, and test in a staging project
--      before applying to production. DO NOT run SECTION 3 blindly.
--
-- NOTHING in SECTION 1 or 2 modifies data. SECTION 3 is commented out.
-- ============================================================================


-- ============================================================================
-- SECTION 1 — READ-ONLY AUDIT (safe to run anytime)
-- ============================================================================

-- 1a. Which public tables have RLS enabled? (rowsecurity = true expected for all)
SELECT
  n.nspname                          AS schema,
  c.relname                          AS table,
  c.relrowsecurity                   AS rls_enabled,
  c.relforcerowsecurity              AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relrowsecurity ASC, c.relname;  -- tables WITHOUT rls float to the top

-- 1b. Every policy currently defined on public tables.
SELECT
  schemaname,
  tablename,
  policyname,
  cmd            AS command,   -- SELECT / INSERT / UPDATE / DELETE / ALL
  roles,
  qual           AS using_expression,
  with_check     AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 1c. Does the is_admin() helper exist? (used by admin-only policies)
SELECT p.proname AS function, pg_get_function_result(p.oid) AS returns
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'is_admin';


-- ============================================================================
-- SECTION 2 — EXPECTED POLICY MODEL (checklist, no SQL executed)
-- ============================================================================
--
-- ADMIN-ONLY tables (writes must require an active admin):
--   products, categories, coupons, admin_notifications, admin_activity_logs
--     SELECT: public read is OK for products/categories (storefront needs it);
--             coupons/admin_* should be admin-only.
--     INSERT/UPDATE/DELETE: is_admin() ONLY.
--
-- OWNER-SCOPED customer tables (each row belongs to one customer):
--   addresses         : customer_id = auth.uid()  for SELECT/INSERT/UPDATE/DELETE
--   Profiles          : id = auth.uid()            (a customer sees/edits only their row)
--   orders            : customer_id = auth.uid()   SELECT only (writes go via backend)
--   order_items       : via parent order ownership SELECT only
--   payments          : customer_id = auth.uid()   SELECT only
--   notifications     : customer_id = auth.uid()
--   coupon_usage      : customer_id = auth.uid()   SELECT only
--   reviews           : SELECT public (approved);  INSERT/UPDATE customer_id = auth.uid()
--   inventory_reservations : session/customer scoped as designed
--
-- KEY TEST: log in as a normal customer in the browser and, using the anon
-- key, attempt to (a) read another user's addresses/orders, and (b) update a
-- product's price or a coupon's discount. All of these MUST fail. If any
-- succeed, RLS is missing on that table — fix before launch.


-- ============================================================================
-- SECTION 3 — HARDENING TEMPLATES (COMMENTED OUT — REVIEW BEFORE USING)
-- ============================================================================
-- These are REFERENCE templates only. They are intentionally commented out.
-- Enabling RLS on a table with no matching policy will BLOCK all access to it
-- and can break the app, so:
--   * confirm from SECTION 1 what already exists,
--   * apply one table at a time,
--   * test the affected screens after each change,
--   * run in a staging Supabase project first.
--
-- ---- Admin-only writes on products (public read stays open) ----------------
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY products_public_read   ON public.products FOR SELECT USING (true);
-- CREATE POLICY products_admin_insert  ON public.products FOR INSERT WITH CHECK (public.is_admin());
-- CREATE POLICY products_admin_update  ON public.products FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
-- CREATE POLICY products_admin_delete  ON public.products FOR DELETE USING (public.is_admin());
--
-- ---- Admin-only coupons ----------------------------------------------------
-- ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY coupons_admin_all ON public.coupons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
--
-- ---- Owner-scoped addresses ------------------------------------------------
-- ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY addresses_owner_select ON public.addresses FOR SELECT USING (customer_id = auth.uid());
-- CREATE POLICY addresses_owner_insert ON public.addresses FOR INSERT WITH CHECK (customer_id = auth.uid());
-- CREATE POLICY addresses_owner_update ON public.addresses FOR UPDATE USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
-- CREATE POLICY addresses_owner_delete ON public.addresses FOR DELETE USING (customer_id = auth.uid());
--
-- ---- Owner-scoped Profiles -------------------------------------------------
-- ALTER TABLE public."Profiles" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY profiles_self_select ON public."Profiles" FOR SELECT USING (id = auth.uid());
-- CREATE POLICY profiles_self_update ON public."Profiles" FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
--
-- (Repeat the owner-scoped pattern for orders/order_items/payments/
--  notifications/coupon_usage/reviews per SECTION 2.)
-- ============================================================================
