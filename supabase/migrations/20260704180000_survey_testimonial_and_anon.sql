-- Beta close-out: optional testimonial fields, and the survey is coming out
-- from behind the auth wall so it stays reachable while the rest of the site
-- redirects to the closed page. Anonymous submissions get a NULL user_id
-- (the column is nullable + UNIQUE, so multiple NULLs are fine).
ALTER TABLE public.beta_survey_responses
  ADD COLUMN IF NOT EXISTS testimonial text,
  ADD COLUMN IF NOT EXISTS testimonial_consent boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Users can submit their own survey response" ON public.beta_survey_responses;
CREATE POLICY "Users and anonymous visitors can submit a survey response" ON public.beta_survey_responses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL)
  );
