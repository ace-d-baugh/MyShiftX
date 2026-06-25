'use client'

import { useEffect } from 'react'
import { fetchUserPreferences } from '@/app/actions/preferences'
import { saveSettings } from '@/lib/settings'
import { applyTheme } from '@/lib/theme'

// Mounted once in the dashboard layout. On login it pulls the user's saved
// preferences from the DB and writes them into localStorage so every device
// starts with the correct theme, time format, timezone, etc.
export function PreferencesSyncer() {
  useEffect(() => {
    fetchUserPreferences().then(prefs => {
      if (!prefs) return
      saveSettings({
        timeFormat: prefs.timeFormat,
        dateFormat: prefs.dateFormat,
        weekStart:  prefs.weekStart,
        timezone:   prefs.timezone,
      })
      applyTheme(prefs.theme)
    })
  }, [])

  return null
}
