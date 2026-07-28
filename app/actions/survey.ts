'use server'

import { createServerClient } from '@/lib/supabase/server'
import { SHOWCASE_MODE } from '@/lib/showcase/mode'
import { SHOWCASE_WRITE_MESSAGE } from '@/lib/showcase/guard'

export type SurveyPayload = {
  heard_from:               string | null
  workplace_type:           string | null
  current_method:           string[]
  ease_register:            number | null
  ease_join_board:          number | null
  ease_post_shift:          number | null
  ease_find_shifts:         number | null
  used_interest:            string | null
  used_contact:             string | null
  received_notifications:   string | null
  notifications_helpful:    number | null
  overall_useful:           number | null
  would_replace:            string | null
  use_frequency:            string | null
  display_mode:             string | null
  primary_device:           string | null
  wanted_features:          string[]
  would_pay:                string | null
  appealing_pro_features:   string[]
  first_impression:         string | null
  boards_clarity:           string | null
  features_used:            string[]
  ease_performance:         number | null
  network_effect:           string | null
  one_thing:                string
  bugs_feedback:            string
  nps:                      string | null
  open_feedback:            string
  feature_awareness:        Record<string, string>
  testimonial:              string
  testimonial_consent:      boolean
}

// Not behind the auth wall (Task: beta close-out) — fully anonymous. No
// identifying info is ever stored, so duplicate-submission prevention is
// handled client-side only (localStorage), not by tying responses to an
// account.
export async function submitSurvey(data: SurveyPayload): Promise<{ error?: string }> {
  // Anonymous and unauthenticated, so it never passes through
  // getActionSession() — showcase mode has to stop it here. Returns the error
  // rather than throwing, matching how the rest of this action reports failure.
  if (SHOWCASE_MODE) return { error: SHOWCASE_WRITE_MESSAGE }

  const supabase = createServerClient()

  try {
    const { error } = await supabase
      .from('beta_survey_responses')
      .insert(data)

    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong submitting the survey.' }
  }
}
