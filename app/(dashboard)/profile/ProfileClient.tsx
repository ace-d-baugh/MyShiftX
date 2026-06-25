'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Bell, LayoutDashboard, Trash2, Save, CheckCircle, Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MyBoardsSection } from '@/components/features/MyBoardsSection'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { displayNameRegex } from '@/lib/validations/auth'
import { getSettings, saveSettings, type UserSettings, type WeekStart, type DateFormat, type TimeFormat, DEFAULT_SETTINGS } from '@/lib/settings'
import { getStoredTheme, applyTheme } from '@/lib/theme'
import { upsertUserPreferences } from '@/app/actions/preferences'
import type { GlobalRole } from '@/lib/database.types'

interface UserProfile {
  id: string
  display_name: string | null
  email: string
  phone_number: string | null
  notify_via_email: boolean
  notify_via_sms: boolean
  role: GlobalRole
  is_active: boolean
  created_at: string
}

interface ProfileClientProps {
  user: UserProfile | null
  sessionUserId: string
}

export function ProfileClient({ user, sessionUserId }: ProfileClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNewOAuthUser = searchParams.get('oauth') === '1'

  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number ?? '')
  const [notifyEmail, setNotifyEmail] = useState(user?.notify_via_email ?? false)
  const [notifySms] = useState(user?.notify_via_sms ?? false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)
  const [createBoardOpen, setCreateBoardOpen] = useState(false)

  // Site settings (localStorage)
  const [siteSettings, setSiteSettings] = useState<UserSettings | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  useEffect(() => {
    setSiteSettings(getSettings())
    setDarkMode(getStoredTheme() === 'dark')
  }, [])

  const syncToDB = (settings: UserSettings, theme: boolean) => {
    upsertUserPreferences({ ...settings, theme: theme ? 'dark' : 'light' })
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, val: UserSettings[K]) => {
    const next = saveSettings({ [key]: val })
    setSiteSettings(next)
    syncToDB(next, darkMode)
  }

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    applyTheme(next ? 'dark' : 'light')
    syncToDB(siteSettings, next)
  }

  // Track whether a valid display name has been saved
  const [hasDisplayNameSaved, setHasDisplayNameSaved] = useState(
    !!(user?.display_name && user.display_name !== 'User' && displayNameRegex.test(user.display_name))
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNameError(null)
    setSaveSuccess(false)

    if (!displayNameRegex.test(displayName)) {
      setNameError('Format: "FirstName [MiddleName] LastInitial." — e.g., "Thomas M." or "Mary Ann M."')
      return
    }

    setSaving(true)
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          phone_number: phoneNumber || null,
          notify_via_email: notifyEmail,
          notify_via_sms: notifySms,
        })
        .eq('id', sessionUserId)

      if (updateError) throw updateError
      setSaveSuccess(true)
      setHasDisplayNameSaved(displayNameRegex.test(displayName))
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    setSaving(true)
    try {
      await supabase.from('users').update({ is_active: false }).eq('id', sessionUserId)
      await supabase.auth.signOut()
      router.push('/login?reason=deactivated')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate account.')
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-warning text-sm">Failed to load profile. Please try refreshing.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-accent text-2xl font-bold text-text">My Profile</h1>
        <p className="text-sm text-text/60">Manage your account settings and boards</p>
      </div>

      {isNewOAuthUser && (
        <div className="p-3 rounded-md bg-info/10 border border-info/20 text-info text-sm">
          Welcome! Set a display name below before posting or joining boards.
        </div>
      )}

      {/* Account Info */}
      <div className="card shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-accent font-bold text-text">Account Info</h2>
            <span className="text-xs text-text/50">{user.email}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 p-3 rounded-md bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Profile saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Display Name</label>
            <input
              type="text"
              className={`input placeholder:text-text/50 ${nameError ? 'border-warning' : ''}`}
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setNameError(null) }}
              placeholder="Thomas M."
            />
            <p className="mt-1 text-xs text-text/40">FirstName [MiddleName] LastInitial. &mdash; e.g., &ldquo;Thomas M.&rdquo; or &ldquo;Mary Ann M.&rdquo;</p>
            {nameError && <p className="mt-1 text-xs text-warning">{nameError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Phone Number (optional)</label>
            <input
              type="tel"
              className="input placeholder:text-text/50"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="(407) 555-0000"
            />
          </div>

          <Button type="submit" loading={saving} size="sm" className="gap-1.5">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </form>
      </div>

      {/* Notifications */}
      <div className="card shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-info/10 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-info" />
          </div>
          <h2 className="font-accent font-bold text-text">Notifications</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-4 cursor-pointer min-h-0">
            <div>
              <p className="text-sm font-medium text-text">Email Notifications</p>
              <p className="text-xs text-text/50">Receive updates via email</p>
            </div>
            <Checkbox
              checked={notifyEmail}
              onChange={e => setNotifyEmail(e.target.checked)}
            />
          </label>
          {/* SMS toggle — hidden until SMS provider is configured */}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Button onClick={handleSave as unknown as React.MouseEventHandler} loading={saving} size="sm" variant="outline" className="gap-1.5">
            <Save className="w-4 h-4" /> Save Notifications
          </Button>
        </div>
      </div>

      {/* My Boards */}
      <div className="card shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <Link href="/boards" className="font-accent font-bold text-text hover:text-primary transition-colors">
              My Boards
            </Link>
            <p className="text-xs text-text/50">Join boards and manage your memberships</p>
          </div>
          <button
            onClick={() => setCreateBoardOpen(true)}
            disabled={!hasDisplayNameSaved}
            className="p-1.5 rounded-md border border-border text-text/40 hover:text-primary hover:border-primary hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-0 min-w-0"
            title="Create a board"
            aria-label="Create a board"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <MyBoardsSection
          userId={sessionUserId}
          displayNameReady={hasDisplayNameSaved}
          createOpen={createBoardOpen}
          onCreateOpenChange={setCreateBoardOpen}
        />
      </div>

      {/* Site Settings */}
      <div className="card shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-accent font-bold text-text">Site Settings</h2>
            <p className="text-xs text-text/50">Calendar and display preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Dark Mode</p>
              <p className="text-xs text-text/50">Switch between light and dark theme</p>
            </div>
            <button
              onClick={toggleDarkMode}
              role="switch"
              aria-checked={darkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${darkMode ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Week Start */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text">Week Starts On</p>
              <p className="text-xs text-text/50">First day shown in calendar</p>
            </div>
            <select
              value={siteSettings?.weekStart ?? 0}
              onChange={e => updateSetting('weekStart', Number(e.target.value) as WeekStart)}
              className="input text-sm h-9 py-0 w-32 shrink-0"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>

          {/* Date Format */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text">Date Format</p>
              <p className="text-xs text-text/50">How dates are displayed</p>
            </div>
            <select
              value={siteSettings?.dateFormat ?? 'mdy'}
              onChange={e => updateSetting('dateFormat', e.target.value as DateFormat)}
              className="input text-sm h-9 py-0 w-32 shrink-0"
            >
              <option value="mdy">MM/DD/YYYY</option>
              <option value="dmy">DD/MM/YYYY</option>
            </select>
          </div>

          {/* Time Format */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text">Time Format</p>
              <p className="text-xs text-text/50">12-hour or 24-hour clock</p>
            </div>
            <select
              value={siteSettings?.timeFormat ?? '12h'}
              onChange={e => updateSetting('timeFormat', e.target.value as TimeFormat)}
              className="input text-sm h-9 py-0 w-32 shrink-0"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text">Timezone</p>
              <p className="text-xs text-text/50">Used for shift times across the app</p>
            </div>
            <select
              value={siteSettings?.timezone ?? DEFAULT_SETTINGS.timezone}
              onChange={e => updateSetting('timezone', e.target.value)}
              className="input text-sm h-9 py-0 w-48 shrink-0"
            >
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
              <option value="America/Anchorage">Alaska (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii (HT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Paris">Central Europe (CET)</option>
              <option value="Asia/Tokyo">Japan (JST)</option>
              <option value="Australia/Sydney">Sydney (AEST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card shadow-sm border border-warning/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="font-accent font-bold text-text">Danger Zone</h2>
            <p className="text-xs text-text/50">Irreversible actions</p>
          </div>
        </div>
        {!deactivateConfirm ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeactivateConfirm(true)}
            className="gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Deactivate Account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-warning font-medium">
              Are you sure? This will deactivate your account and remove all your posts. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeactivateConfirm(false)}>Cancel</Button>
              <Button variant="danger" size="sm" loading={saving} onClick={handleDeactivate} className="gap-1.5">
                <Trash2 className="w-4 h-4" /> Yes, Deactivate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
