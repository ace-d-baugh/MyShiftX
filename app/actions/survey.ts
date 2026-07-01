'use server'

import { getActionSession } from '@/lib/auth/session'

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
}

export async function submitSurvey(data: SurveyPayload): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await getActionSession()

    // Check for duplicate submission
    const { data: existing } = await supabase
      .from('beta_survey_responses')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) return { error: 'DUPLICATE' }

    const { error } = await supabase
      .from('beta_survey_responses')
      .insert({ user_id: userId, ...data })

    // Unique-constraint hit means a concurrent submission won the race
    if (error?.code === '23505') return { error: 'DUPLICATE' }
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Not authenticated.' }
  }
}

export async function checkExistingSubmission(): Promise<boolean> {
  try {
    const { supabase, userId } = await getActionSession()
    const { data } = await supabase
      .from('beta_survey_responses')
      .select('id')
      .eq('user_id', userId)
      .single()
    return !!data
  } catch {
    return false
  }
}
