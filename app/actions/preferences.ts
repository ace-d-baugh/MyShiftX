'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { Theme } from '@/lib/theme'
import type { UserSettings } from '@/lib/settings'

export type DBPreferences = UserSettings & { theme: Theme }

export async function fetchUserPreferences(): Promise<DBPreferences | null> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_preferences')
    .select('theme, time_format, date_format, week_start, timezone')
    .eq('user_id', user.id)
    .single()

  if (!data) return null

  return {
    theme:      data.theme      as Theme,
    timeFormat: data.time_format as UserSettings['timeFormat'],
    dateFormat: data.date_format as UserSettings['dateFormat'],
    weekStart:  data.week_start  as UserSettings['weekStart'],
    timezone:   data.timezone,
  }
}

export async function upsertUserPreferences(prefs: DBPreferences): Promise<void> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('user_preferences').upsert({
    user_id:     user.id,
    theme:       prefs.theme,
    time_format: prefs.timeFormat,
    date_format: prefs.dateFormat,
    week_start:  prefs.weekStart,
    timezone:    prefs.timezone,
    updated_at:  new Date().toISOString(),
  }, { onConflict: 'user_id' })
}
