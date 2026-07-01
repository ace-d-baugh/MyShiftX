-- The beta survey form (SurveyClient.tsx) collects and submits 6 fields that
-- were never added to beta_survey_responses, meaning every real submission
-- has been failing with a "column does not exist" error since launch (the
-- table has 0 rows, consistent with this). Add the missing columns to match
-- what the app actually submits.
ALTER TABLE public.beta_survey_responses
  ADD COLUMN IF NOT EXISTS first_impression text,
  ADD COLUMN IF NOT EXISTS boards_clarity text,
  ADD COLUMN IF NOT EXISTS features_used text[],
  ADD COLUMN IF NOT EXISTS ease_performance smallint,
  ADD COLUMN IF NOT EXISTS network_effect text,
  ADD COLUMN IF NOT EXISTS one_thing text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'beta_survey_responses_ease_performance_check'
  ) THEN
    ALTER TABLE public.beta_survey_responses
      ADD CONSTRAINT beta_survey_responses_ease_performance_check
      CHECK (ease_performance >= 1 AND ease_performance <= 5);
  END IF;
END $$;
