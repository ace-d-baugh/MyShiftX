-- The requests_update_own policy had no WITH CHECK clause. Without it,
-- PostgreSQL falls back to using the USING clause as the check expression,
-- but in some edge cases (e.g. when the row's user_id is evaluated against
-- the updated row rather than the original row) this can silently block
-- the update. Adding an explicit WITH CHECK makes the intent unambiguous.

DROP POLICY IF EXISTS "requests_update_own" ON public.requests;

CREATE POLICY "requests_update_own"
  ON public.requests FOR UPDATE
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
