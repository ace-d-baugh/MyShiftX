-- Track how a shift/request post was removed: expired automatically, removed by
-- a board leader/mod (via flag resolution), or removed by the owner themselves.
ALTER TABLE public.shifts
  ADD COLUMN removed_reason text CHECK (removed_reason IN ('expired', 'leader_removed', 'user_removed')),
  ADD COLUMN removed_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.requests
  ADD COLUMN removed_reason text CHECK (removed_reason IN ('expired', 'leader_removed', 'user_removed')),
  ADD COLUMN removed_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Self-deactivation now records who did it and why.
CREATE OR REPLACE FUNCTION public.deactivate_own_shift(p_shift_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.shifts
  SET    is_active = false,
         removed_reason = 'user_removed',
         removed_by_user_id = auth.uid()
  WHERE  id = p_shift_id
    AND  user_id = auth.uid();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.deactivate_own_request(p_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.requests
  SET    is_active = false,
         removed_reason = 'user_removed',
         removed_by_user_id = auth.uid()
  WHERE  id = p_request_id
    AND  user_id = auth.uid();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$function$;

-- Cron expiration now tags the reason.
CREATE OR REPLACE FUNCTION public.expire_shifts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  UPDATE public.shifts
  SET is_active = false, removed_reason = 'expired'
  WHERE is_active = true AND expires_at <= NOW();
$function$;

CREATE OR REPLACE FUNCTION public.expire_requests()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  UPDATE public.requests
  SET is_active = false, removed_reason = 'expired'
  WHERE is_active = true AND expires_at <= NOW();
$function$;
