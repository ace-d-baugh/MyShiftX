'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { UserType } from '@/lib/database.types'

interface Proficiency {
  role_name: string | null
  property_name: string | null
  location_name: string | null
}

interface EditUser {
  id: string
  display_name: string
  email: string
  user_type: UserType
  is_active: boolean
  created_at: string
  proficiencies: Proficiency[]
}

const userTypeOptions: UserType[] = ['Guest', 'Cast', 'CoPro', 'Leader', 'Admin']

const userTypeVariant: Record<UserType, 'guest' | 'cast' | 'copro' | 'leader' | 'admin'> = {
  Guest: 'guest', Cast: 'cast', CoPro: 'copro', Leader: 'leader', Admin: 'admin',
}

interface UserEditClientProps {
  user: EditUser
  adminId: string
}

export function UserEditClient({ user, adminId }: UserEditClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const [displayName, setDisplayName] = useState(user.display_name)
  const [userType, setUserType] = useState<UserType>(user.user_type)
  const [isActive, setIsActive] = useState(user.is_active)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty =
    displayName !== user.display_name ||
    userType !== user.user_type ||
    isActive !== user.is_active

  const handleSave = async () => {
    if (!displayName.trim()) { setError('Display name cannot be empty.'); return }
    setSaving(true)
    setError(null)
    const { error: e } = await (supabase as any)
      .from('users')
      .update({ display_name: displayName.trim(), user_type: userType, is_active: isActive } as any)
      .eq('id', user.id)
    if (e) {
      setError(e.message)
      setSaving(false)
      return
    }
    setSaving(false)
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      router.push('/admin')
    }, 1200)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2 rounded-md text-text/50 hover:text-primary hover:bg-primary-light transition-colors min-h-0 min-w-0"
          aria-label="Back to Admin"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-accent text-2xl font-bold text-text">Edit Cast Member</h1>
          <p className="text-sm text-text/60">Joined {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-md bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Saved! Returning to admin...
        </div>
      )}

      <div className="card space-y-5 mb-6">
        {/* Email — read only */}
        <div>
          <label className="block text-xs font-medium text-text/60 mb-1">Email</label>
          <p className="text-sm text-text/70 font-mono bg-text/5 rounded-md px-3 py-2">{user.email}</p>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-medium text-text/60 mb-1">Display Name</label>
          <input
            className="input text-sm"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Display name..."
          />
        </div>

        {/* User Type */}
        <div>
          <label className="block text-xs font-medium text-text/60 mb-1">User Type</label>
          <div className="flex items-center gap-3">
            <select
              className="input text-sm flex-1"
              value={userType}
              onChange={e => setUserType(e.target.value as UserType)}
              disabled={user.id === adminId}
            >
              {userTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <Badge variant={userTypeVariant[userType]}>{userType}</Badge>
          </div>
          {user.id === adminId && (
            <p className="text-xs text-text/40 mt-1 italic">Cannot change your own user type.</p>
          )}
        </div>

        {/* Active status */}
        <div>
          <label className="block text-xs font-medium text-text/60 mb-2">Account Status</label>
          <button
            onClick={() => { if (user.id !== adminId) setIsActive(prev => !prev) }}
            disabled={user.id === adminId}
            className={cn(
              'badge text-xs cursor-pointer transition-colors min-h-0 min-w-0',
              isActive ? 'bg-success/20 text-success hover:bg-success/30' : 'bg-warning/20 text-warning hover:bg-warning/30',
              user.id === adminId && 'cursor-default opacity-60'
            )}
          >
            {isActive ? 'Active' : 'Inactive'} — click to toggle
          </button>
        </div>

        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!isDirty || saving}
          className="w-full gap-2"
        >
          <Save className="w-4 h-4" />Save Changes
        </Button>
      </div>

      {/* Proficiencies */}
      <div className="card">
        <h2 className="font-medium text-text mb-3">Proficiencies</h2>
        {user.proficiencies.length === 0 ? (
          <p className="text-sm text-text/50 italic">No proficiencies added yet.</p>
        ) : (
          <div className="space-y-2">
            {user.proficiencies.map((p, i) => (
              <div key={i} className="flex items-center gap-1 text-sm bg-primary-light/50 rounded-md px-3 py-2">
                <span className="font-medium text-text">{p.role_name ?? '—'}</span>
                <span className="text-text/40 mx-0.5">&bull;</span>
                <span className="text-text/70">{p.property_name ?? '—'}</span>
                <span className="text-text/40 mx-0.5">&rsaquo;</span>
                <span className="text-text/70">{p.location_name ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
