-- Finishes database groundwork that was left partially applied: boards.status
-- and users.first_name/last_name already existed live (columns added,
-- handle_new_user() already writing first_name/last_name, all 8 boards and
-- all 17 users already backfilled) but two pieces were missing:
--   1. Neither new column had a SELECT grant. This repo uses explicit
--      column-level grants instead of table-wide (see 20260730003000 and
--      20260701152710) -- a new column has NO grant until one is added, and
--      selecting it fails the WHOLE query with "permission denied for table
--      X", not just that column. WDW's own equivalent migration hit this
--      same trap on its first pass; still worth restating since it's easy to
--      forget a second time.
--   2. get_users_admin() had not been widened to return the new columns, and
--      display_name was still being built as "First L." rather than the full
--      "First Last" -- confirmed wanted 2026-08-17 (useful for business
--      purposes), so this migration is also where that switch actually lands.
--
-- Every statement below is safe to run whether or not the earlier partial
-- work already happened: ALTER ... ADD COLUMN IF NOT EXISTS, the backfill
-- UPDATEs are WHERE-guarded to only touch untouched rows, and GRANT/CREATE OR
-- REPLACE are naturally idempotent.

ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'deleted'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

GRANT SELECT (status) ON public.boards TO anon, authenticated;
GRANT SELECT (first_name, last_name) ON public.users TO anon, authenticated;

UPDATE public.boards
  SET status = CASE WHEN is_active THEN 'active' ELSE 'paused' END
  WHERE status = 'active' AND NOT is_active; -- only fixes a mismatch, never touches a match

UPDATE public.users
  SET
    first_name = CASE
      WHEN trim(display_name) ~ '\s' THEN regexp_replace(trim(display_name), '\s+\S+$', '')
      ELSE trim(display_name)
    END,
    last_name = CASE
      WHEN trim(display_name) ~ '\s' THEN
        (regexp_split_to_array(trim(display_name), '\s+'))[array_length(regexp_split_to_array(trim(display_name), '\s+'), 1)]
      ELSE NULL
    END
  WHERE display_name IS NOT NULL
    AND first_name IS NULL AND last_name IS NULL;

-- handle_new_user(): given_name/family_name-first, full_name/name-fallback
-- branching, now building display_name as the full "First Last" and writing
-- first_name/last_name alongside it from the same parsed values.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name text;
  v_given_name   text;
  v_family_name  text;
  v_full_name    text;
  v_first_name   text;
  v_last_name    text;
BEGIN
  IF NEW.email ILIKE '%@disney.com' THEN
    RAISE EXCEPTION 'This email address cannot be used to register.';
  END IF;

  v_given_name  := trim(NEW.raw_user_meta_data->>'given_name');
  v_family_name := trim(NEW.raw_user_meta_data->>'family_name');

  IF v_given_name IS NOT NULL AND v_given_name <> ''
     AND v_family_name IS NOT NULL AND v_family_name <> '' THEN
    -- Preferred: Google gave us separate first/last fields
    v_display_name := initcap(v_given_name) || ' ' || initcap(v_family_name);
    v_first_name := initcap(v_given_name);
    v_last_name  := initcap(v_family_name);
  ELSE
    -- Fallback: full_name or name (already "First Last"), just normalise case
    v_full_name := trim(COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(trim(NEW.raw_user_meta_data->>'name'), '')
    ));

    -- Require at least a first + last (a space) before deriving a name
    IF v_full_name IS NOT NULL AND position(' ' IN v_full_name) > 0 THEN
      v_display_name := initcap(v_full_name);
      v_first_name := initcap(regexp_replace(v_full_name, '\s+\S+$', ''));
      v_last_name  := initcap((regexp_split_to_array(v_full_name, '\s+'))[array_length(regexp_split_to_array(v_full_name, '\s+'), 1)]);
    END IF;
  END IF;

  INSERT INTO public.users (id, email, display_name, first_name, last_name, email_verified, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_first_name,
    v_last_name,
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false),
    'Guest',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- get_users_admin(): add first_name/last_name to the Overlord panel's user
-- feed. DROP first: CREATE OR REPLACE cannot change a RETURNS TABLE
-- function's column list. billing_cycle stays -- unlike WDWShiftX, this app
-- still has Stripe billing and the Overlord panel's existing membership UI
-- depends on it; dropping it here would silently break that tab.
DROP FUNCTION IF EXISTS public.get_users_admin();

CREATE FUNCTION public.get_users_admin()
RETURNS TABLE (
  id uuid,
  display_name text,
  first_name text,
  last_name text,
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
  SELECT id, display_name, first_name, last_name, role, is_active, created_at, membership, billing_cycle
  FROM public.users
  WHERE get_user_role() = 'admin'
  ORDER BY display_name;
$$;

REVOKE ALL ON FUNCTION public.get_users_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_users_admin() TO authenticated, service_role;
