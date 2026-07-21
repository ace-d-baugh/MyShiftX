'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchPreferences } from '@/lib/preferences'
import { saveSettings } from '@/lib/settings'
import { applyTheme } from '@/lib/theme'

export function PreferencesSyncer() {
  const pathname = usePathname()

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

      // The Profile page owns its own theme state — it re-checks Pro status on
      // mount and reverts a now-locked Pro theme (see ProfileClient). Applying
      // the DB theme here would race that async revert on a hard refresh and
      // clobber it, so leave theme to Profile while we're on it. Everywhere
      // else, keep the user's chosen theme (Pro theme included) as-is.
      if (!pathname.startsWith('/profile')) {
        applyTheme(prefs.theme)
      }
    }
    sync()
  }, [pathname])

  return null
}
