-- Backfill migration: beta_survey_responses existed live in production (applied
-- directly via SQL Editor) with no corresponding migration file in the repo.
-- This is a no-op against the current DB (table already exists) but lets a
-- fresh restore from the repo recreate it correctly.
CREATE TABLE IF NOT EXISTS public.beta_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz DEFAULT now(),
  heard_from text,
  workplace_type text,
  current_method text[],
  ease_register smallint CHECK (ease_register >= 1 AND ease_register <= 5),
  ease_join_board smallint CHECK (ease_join_board >= 1 AND ease_join_board <= 5),
  ease_post_shift smallint CHECK (ease_post_shift >= 1 AND ease_post_shift <= 5),
  ease_find_shifts smallint CHECK (ease_find_shifts >= 1 AND ease_find_shifts <= 5),
  used_interest text,
  used_contact text,
  received_notifications text,
  notifications_helpful smallint CHECK (notifications_helpful >= 1 AND notifications_helpful <= 5),
  overall_useful smallint CHECK (overall_useful >= 1 AND overall_useful <= 5),
  would_replace text,
  use_frequency text,
  display_mode text,
  primary_device text,
  wanted_features text[],
  would_pay text,
  appealing_pro_features text[],
  bugs_feedback text,
  nps text,
  open_feedback text
);

ALTER TABLE public.beta_survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can read all responses" ON public.beta_survey_responses;
CREATE POLICY "Service role can read all responses" ON public.beta_survey_responses
  FOR SELECT USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can submit their own survey response" ON public.beta_survey_responses;
CREATE POLICY "Users can submit their own survey response" ON public.beta_survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
