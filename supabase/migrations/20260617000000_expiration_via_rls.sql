-- ============================================================
-- Move expiration enforcement into RLS so the wall hides
-- expired posts at query time instead of relying on a cron job
-- running every 5 minutes.
--
-- The Vercel free plan only allows one cron execution per day,
-- so we cannot rely on it for timely expiration.  Instead:
--   • Member SELECT policies now also check expires_at > NOW()
--   • The daily cron still marks rows is_active = false (cleanup)
--   • The archive page queries both is_active=false and expired
--
-- Moderator / admin SELECT policies are unchanged: they see all
-- rows regardless of expiry so the archive and flag views work.
-- ============================================================

-- ── Shifts ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "shifts_select_member" ON public.shifts;

CREATE POLICY "shifts_select_member"
  ON public.shifts FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND is_board_member(board_id)
  );

-- ── Requests ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "requests_select_member" ON public.requests;

CREATE POLICY "requests_select_member"
  ON public.requests FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND is_board_member(board_id)
  );

-- ── Ensure expire functions exist for the daily cleanup cron ──────────────────

CREATE OR REPLACE FUNCTION public.expire_shifts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shifts
  SET is_active = false
  WHERE is_active = true AND expires_at <= NOW();
$$;

CREATE OR REPLACE FUNCTION public.expire_requests()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.requests
  SET is_active = false
  WHERE is_active = true AND expires_at <= NOW();
$$;
