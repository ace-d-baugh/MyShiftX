'use server'

import { createServerClient } from '@/lib/supabase/server'

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

// Not behind the auth wall (Task: beta close-out) — logged-in users still get
// their response tied to their account and deduped, but a signed-out visitor
// (or anyone reaching /survey after the site goes dark) can still submit.
export async function submitSurvey(data: SurveyPayload): Promise<{ error?: string }> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  try {
    if (userId) {
      const { data: existing } = await supabase
        .from('beta_survey_responses')
        .select('id')
        .eq('user_id', userId)
        .single()
      if (existing) return { error: 'DUPLICATE' }
    }

    const { error } = await supabase
      .from('beta_survey_responses')
      .insert({ user_id: userId, ...data })

    // Unique-constraint hit means a concurrent submission won the race
    if (error?.code === '23505') return { error: 'DUPLICATE' }
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong submitting the survey.' }
  }
}

export async function checkExistingSubmission(): Promise<boolean> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('beta_survey_responses')
    .select('id')
    .eq('user_id', user.id)
    .single()
  return !!data
}
