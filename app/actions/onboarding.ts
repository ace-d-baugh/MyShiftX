'use server'

import { getActionSession } from '@/lib/auth/session'

/**
 * Task 22: mark the /welcome wizard as finished or skipped. Once set, the
 * Wall stops routing brand-new users to /welcome.
 */
export async function dismissOnboarding(): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await getActionSession()

    const { error } = await supabase
      .from('users')
      .update({ onboarding_dismissed_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
