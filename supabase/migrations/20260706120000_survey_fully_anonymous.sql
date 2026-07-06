-- Beta survey is now fully anonymous: no user_id is ever recorded, and the
-- column is dropped entirely (only 1 existing row, and it already had a
-- NULL user_id, so nothing identifying is lost).
DROP POLICY IF EXISTS "Users and anonymous visitors can submit a survey response" ON public.beta_survey_responses;
-- Existed only to support the old server-side "already submitted" check,
-- which is now handled client-side (localStorage) instead.
DROP POLICY IF EXISTS "Users can read their own survey response" ON public.beta_survey_responses;

ALTER TABLE public.beta_survey_responses DROP COLUMN IF EXISTS user_id;

CREATE POLICY "Anyone can submit a survey response" ON public.beta_survey_responses
  FOR INSERT WITH CHECK (true);
