-- Task 15: Photo Schedule Import — monthly quota tracking.
-- Free (Basic): 4 imports/month. Pro/Trial: unlimited.
-- Counter resets lazily inside the RPCs when the ET month rolls over,
-- so no cron changes are needed.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS schedule_import_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS schedule_import_month text;

-- Write protection: same idiom as enforce_membership_protection. The quota
-- fields may only change via the SECURITY DEFINER RPCs below (which set a
-- transaction-local flag before updating) or the service role — a user
-- PATCHing their own row cannot reset their quota.
CREATE OR REPLACE FUNCTION public.protect_schedule_import_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'authenticated'
     AND coalesce(current_setting('myshiftx.allow_import_update', true), '') <> '1' THEN
    NEW.schedule_import_count := OLD.schedule_import_count;
    NEW.schedule_import_month := OLD.schedule_import_month;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.protect_schedule_import_fields() FROM anon, authenticated;

DROP TRIGGER IF EXISTS enforce_schedule_import_protection ON public.users;
CREATE TRIGGER enforce_schedule_import_protection
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  WHEN (
    (NEW.schedule_import_count IS DISTINCT FROM OLD.schedule_import_count) OR
    (NEW.schedule_import_month IS DISTINCT FROM OLD.schedule_import_month)
  )
  EXECUTE FUNCTION public.protect_schedule_import_fields();

-- Current quota status for the calling user (lazy month reset).
-- import_limit = -1 means unlimited (Pro/Trial).
CREATE OR REPLACE FUNCTION public.get_schedule_import_status()
RETURNS TABLE (membership text, used integer, import_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month text := to_char(now() AT TIME ZONE 'America/New_York', 'YYYY-MM');
  v_membership text;
  v_used integer;
  v_stored_month text;
BEGIN
  SELECT u.membership, u.schedule_import_count, u.schedule_import_month
    INTO v_membership, v_used, v_stored_month
  FROM public.users u
  WHERE u.id = auth.uid();

  IF v_membership IS NULL THEN RETURN; END IF;

  IF v_stored_month IS DISTINCT FROM v_month THEN
    PERFORM set_config('myshiftx.allow_import_update', '1', true);
    UPDATE public.users
      SET schedule_import_count = 0, schedule_import_month = v_month
      WHERE id = auth.uid();
    v_used := 0;
  END IF;

  membership := v_membership;
  used := v_used;
  import_limit := CASE WHEN v_membership IN ('Pro', 'Trial') THEN -1 ELSE 4 END;
  RETURN NEXT;
END;
$$;

-- Atomically consume one import. Returns the new used count,
-- or -1 if the caller has no quota remaining.
CREATE OR REPLACE FUNCTION public.consume_schedule_import()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month text := to_char(now() AT TIME ZONE 'America/New_York', 'YYYY-MM');
  v_membership text;
  v_used integer;
  v_stored_month text;
  v_limit integer;
BEGIN
  SELECT u.membership, u.schedule_import_count, u.schedule_import_month
    INTO v_membership, v_used, v_stored_month
  FROM public.users u
  WHERE u.id = auth.uid()
  FOR UPDATE;

  IF v_membership IS NULL THEN RETURN -1; END IF;

  IF v_stored_month IS DISTINCT FROM v_month THEN
    v_used := 0;
  END IF;

  v_limit := CASE WHEN v_membership IN ('Pro', 'Trial') THEN -1 ELSE 4 END;
  IF v_limit >= 0 AND v_used >= v_limit THEN RETURN -1; END IF;

  PERFORM set_config('myshiftx.allow_import_update', '1', true);
  UPDATE public.users
    SET schedule_import_count = v_used + 1, schedule_import_month = v_month
    WHERE id = auth.uid();

  RETURN v_used + 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_schedule_import_status() FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_schedule_import() FROM anon;
