-- Adds avatar_url to get_users_admin() so the Overlord panel's Users tab can
-- show each member's photo. Same DROP+CREATE constraint and the same
-- grant-reset hazard as the messaging RPCs (see 20260822130000) -- this one
-- matters most of the three, since get_users_admin() returns a row for every
-- user in the system and would become anon-callable if the lockdown from
-- 20260719151000_function_execute_lockdown.sql weren't reissued below.
--
-- Body is MyShiftX's current live definition with avatar_url added -- note it
-- keeps membership and billing_cycle, which this fork has and WDWShiftX does
-- not, so this could not be copied from there.

DROP FUNCTION IF EXISTS public.get_users_admin();

CREATE FUNCTION public.get_users_admin()
RETURNS TABLE(
  id uuid,
  display_name text,
  first_name text,
  last_name text,
  avatar_url text,
  role text,
  is_active boolean,
  created_at timestamp with time zone,
  membership text,
  billing_cycle text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, display_name, first_name, last_name, avatar_url, role, is_active, created_at, membership, billing_cycle
  FROM public.users
  WHERE get_user_role() = 'admin'
  ORDER BY display_name;
$function$;

-- Reissue the lockdown the DROP above just reset.
REVOKE ALL ON FUNCTION public.get_users_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_users_admin() TO authenticated, service_role;
