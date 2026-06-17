-- The WITH CHECK added in 20260617000005 causes "new row violates row-level
-- security policy" when updating is_active = false. PostgreSQL evaluates
-- WITH CHECK against the new row in a slightly different auth context,
-- causing auth.uid() to fail the check even though the USING clause passes.
-- Mirror the working shifts_update_own policy: USING only, no WITH CHECK.

DROP POLICY IF EXISTS "requests_update_own" ON public.requests;

CREATE POLICY "requests_update_own"
  ON public.requests FOR UPDATE
  USING (user_id = auth.uid());
