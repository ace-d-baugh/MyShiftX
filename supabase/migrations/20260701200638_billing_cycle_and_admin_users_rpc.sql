-- Track WHICH Pro billing plan a user is on (membership already distinguishes
-- Basic/Trial/Pro at a high level; this adds the billing-cycle granularity
-- needed for admin filtering/display).
ALTER TABLE public.users
  ADD COLUMN billing_cycle text CHECK (billing_cycle IN ('monthly', 'semi_annual', 'yearly'));

-- Backfill: everyone was just grandfathered onto Pro — assign them Yearly.
UPDATE public.users SET billing_cycle = 'yearly' WHERE membership = 'Pro';

-- billing_cycle is the same class of billing-sensitive data as
-- membership/trial_ends_at/trial_used — extend the existing write protection
-- (only the service role / Stripe webhook should ever set it) and read
-- protection (already column-revoked from anon/authenticated by omission,
-- since it's a new column and no SELECT grant was issued for it).
CREATE OR REPLACE FUNCTION public.protect_membership_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.membership     := OLD.membership;
    NEW.trial_ends_at  := OLD.trial_ends_at;
    NEW.trial_used     := OLD.trial_used;
    NEW.billing_cycle  := OLD.billing_cycle;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_membership_protection ON public.users;
CREATE TRIGGER enforce_membership_protection
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  WHEN (
    (NEW.membership IS DISTINCT FROM OLD.membership) OR
    (NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at) OR
    (NEW.trial_used IS DISTINCT FROM OLD.trial_used) OR
    (NEW.billing_cycle IS DISTINCT FROM OLD.billing_cycle)
  )
  EXECUTE FUNCTION public.protect_membership_fields();

-- Extend the existing "read your own membership" RPC to include billing_cycle.
DROP FUNCTION IF EXISTS public.get_own_membership();
CREATE FUNCTION public.get_own_membership()
RETURNS TABLE (membership text, trial_ends_at timestamptz, trial_used boolean, billing_cycle text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT membership, trial_ends_at, trial_used, billing_cycle
  FROM public.users
  WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.get_own_membership() TO authenticated;

-- Admin-only RPC: the admin panel needs membership/billing_cycle across ALL
-- users, which the column-level SELECT restriction otherwise blocks entirely
-- for the `authenticated` role. Internally gated to Admins only.
CREATE OR REPLACE FUNCTION public.get_users_admin()
RETURNS TABLE (
  id uuid,
  display_name text,
  role text,
  is_active boolean,
  created_at timestamptz,
  membership text,
  billing_cycle text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, display_name, role, is_active, created_at, membership, billing_cycle
  FROM public.users
  WHERE get_user_role() = 'admin'
  ORDER BY display_name;
$$;

REVOKE EXECUTE ON FUNCTION public.get_users_admin() FROM anon;
