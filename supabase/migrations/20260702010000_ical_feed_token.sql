-- Task 17: Calendar Export & Sync (iCal feed). Pro/Trial only.
-- ical_token is the sole authentication for a user's calendar feed URL, so it
-- must never be readable by other users. The users table SELECT grant is an
-- explicit column list (see 20260701152710) that does NOT include this new
-- column, so it is invisible to anon/authenticated reads automatically; the
-- caller's own token is exposed only via the SECURITY DEFINER RPCs below.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ical_token uuid UNIQUE;

-- Returns the caller's feed token, generating one on first use.
-- NULL for Basic members — the feed is a Pro/Trial feature.
CREATE OR REPLACE FUNCTION public.get_or_create_ical_token()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership text;
  v_token uuid;
BEGIN
  SELECT u.membership, u.ical_token INTO v_membership, v_token
  FROM public.users u
  WHERE u.id = auth.uid();

  IF v_membership IS NULL OR v_membership NOT IN ('Pro', 'Trial') THEN
    RETURN NULL;
  END IF;

  IF v_token IS NULL THEN
    v_token := gen_random_uuid();
    UPDATE public.users SET ical_token = v_token WHERE id = auth.uid();
  END IF;

  RETURN v_token;
END;
$$;

-- Rotates the caller's feed token (invalidates the old URL). NULL for Basic.
CREATE OR REPLACE FUNCTION public.reset_ical_token()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership text;
  v_token uuid;
BEGIN
  SELECT u.membership INTO v_membership
  FROM public.users u
  WHERE u.id = auth.uid();

  IF v_membership IS NULL OR v_membership NOT IN ('Pro', 'Trial') THEN
    RETURN NULL;
  END IF;

  v_token := gen_random_uuid();
  UPDATE public.users SET ical_token = v_token WHERE id = auth.uid();
  RETURN v_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_ical_token() FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_ical_token() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_ical_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_ical_token() TO authenticated;
