import { createClient } from '@/lib/supabase/client'
import type { Theme } from '@/lib/theme'
import type { UserSettings } from '@/lib/settings'

export type DBPreferences = UserSettings & { theme: Theme }

export async function fetchPreferences(userId: string): Promise<DBPreferences | null> {
  const supabase = createClient()
  // maybeSingle, not single: a user who has never saved preferences has no
  // row yet, and .single() turns that into a 406 (plus client retries).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_preferences')
    .select('theme, time_format, date_format, week_start, timezone')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null

  return {
    theme:      data.theme       as Theme,
    timeFormat: data.time_format as UserSettings['timeFormat'],
    dateFormat: data.date_format as UserSettings['dateFormat'],
    weekStart:  data.week_start  as UserSettings['weekStart'],
    timezone:   data.timezone,
  }
}

export async function upsertPreferences(userId: string, prefs: DBPreferences): Promise<void> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('user_preferences').upsert({
    user_id:     userId,
    theme:       prefs.theme,
    time_format: prefs.timeFormat,
    date_format: prefs.dateFormat,
    week_start:  prefs.weekStart,
    timezone:    prefs.timezone,
    updated_at:  new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) console.error('[preferences] upsert failed:', error)
}
