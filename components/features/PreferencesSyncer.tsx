'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchPreferences } from '@/lib/preferences'
import { saveSettings } from '@/lib/settings'
import { applyTheme } from '@/lib/theme'

export function PreferencesSyncer() {
  useEffect(() => {
    async function sync() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const prefs = await fetchPreferences(user.id)
      if (!prefs) return

      saveSettings({
        timeFormat: prefs.timeFormat,
        dateFormat: prefs.dateFormat,
        weekStart:  prefs.weekStart,
        timezone:   prefs.timezone,
      })
      applyTheme(prefs.theme)
    }
    sync()
  }, [])

  return null
}
