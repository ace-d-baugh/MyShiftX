-- Beta closure survey addition: a single "did you know about it / did you like
-- it" rating per feature (Wall interactions, Messaging, Calendar, Push, Dark
-- mode), stored as jsonb keyed by feature slug rather than one column per
-- feature since the feature list only needs to exist for this one survey.
ALTER TABLE public.beta_survey_responses
  ADD COLUMN IF NOT EXISTS feature_awareness jsonb;
