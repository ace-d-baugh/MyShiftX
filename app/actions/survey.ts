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
}

export async function submitSurvey(data: SurveyPayload): Promise<{ error?: string }> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Check for duplicate submission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('beta_survey_responses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) return { error: 'DUPLICATE' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('beta_survey_responses')
    .insert({ user_id: user.id, ...data })

  if (error) return { error: error.message }
  return {}
}

export async function checkExistingSubmission(): Promise<boolean> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('beta_survey_responses')
    .select('id')
    .eq('user_id', user.id)
    .single()
  return !!data
}
