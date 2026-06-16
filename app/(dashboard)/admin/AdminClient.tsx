'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Settings, Building, MapPin, Briefcase, Users, Plus, CheckCircle, XCircle, Pencil, X, Save, Search, UserCog } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { UserType } from '@/lib/database.types'

type AdminTab = 'roles' | 'properties' | 'locations' | 'cast'

interface Property { id: string; name: string; created_at: string }
interface Location { id: string; name: string; property_id: string; is_approved: boolean; created_at: string; properties: { name: string } | null }
interface Role { id: string; name: string; is_approved: boolean; created_at: string }
interface UserProficiency {
  role_id: string
  property_id: string
  location_id: string
  roles: { id: string; name: string } | null
  properties: { id: string; name: string } | null
  locations: { id: string; name: string } | null
}
interface UserRow {
  id: string
  display_name: string
  user_type: UserType
  is_active: boolean
  created_at: string
  user_proficiencies: UserProficiency[]
}

interface AdminClientProps {
  properties: Property[]
  locations: Location[]
  roles: Role[]
  users: UserRow[]
  adminId: string
  currentUserType: UserType
}

const userTypeOptions: UserType[] = ['Guest', 'Cast', 'Mod', 'Leader', 'Admin']

const userTypeVariant: Record<UserType, 'guest' | 'cast' | 'mod' | 'leader' | 'admin'> = {
  Guest: 'guest', Cast: 'cast', Mod: 'mod', Leader: 'leader', Admin: 'admin',
}

export function AdminClient({
  properties: initProps,
  locations: initLocs,
  roles: initRoles,
  users: initUsers,
  adminId,
  currentUserType,
}: AdminClientProps) {
  const supabase = createClient()
  const [tab, setTab] = useState<AdminTab>('roles')
  const [properties, setProperties] = useState(initProps)
  const [locations, setLocations] = useState(initLocs)
  const [roles, setRoles] = useState(initRoles)
  const [users, setUsers] = useState(initUsers)
  const [processing, setProcessing] = useState<string | null>(null)

  // Add forms
  const [newPropertyName, setNewPropertyName] = useState('')
  const [newLocationName, setNewLocationName] = useState('')
  const [newLocationPropId, setNewLocationPropId] = useState('')
  const [newRoleName, setNewRoleName] = useState('')

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  // Cast tab filters
  const [castSearch, setCastSearch] = useState('')
  const [filterCastRole, setFilterCastRole] = useState('')
  const [filterCastProperty, setFilterCastProperty] = useState('')
  const [filterCastLocation, setFilterCastLocation] = useState('')
  const [filterCastUserType, setFilterCastUserType] = useState('')

  // Feedback
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Tab indicator animation
  const tabRefs = useRef<Map<AdminTab, HTMLButtonElement | null>>(new Map())
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const [indicatorReady, setIndicatorReady] = useState(false)

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  useEffect(() => {
    const btn = tabRefs.current.get(tab)
    if (btn) {
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
      setIndicatorReady(true)
    }
  }, [tab])

  const castFilterLocations = useMemo(() => {
    return filterCastProperty
      ? locations.filter(l => l.property_id === filterCastProperty)
      : locations
  }, [filterCastProperty, locations])

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (castSearch && !u.display_name.toLowerCase().includes(castSearch.toLowerCase())) return false
      if (filterCastUserType && u.user_type !== filterCastUserType) return false
      if (filterCastRole && !u.user_proficiencies.some(p => p.role_id === filterCastRole)) return false
      if (filterCastProperty && !u.user_proficiencies.some(p => p.property_id === filterCastProperty)) return false
      if (filterCastLocation && !u.user_proficiencies.some(p => p.location_id === filterCastLocation)) return false
      return true
    })
  }, [users, castSearch, filterCastUserType, filterCastRole, filterCastProperty, filterCastLocation])

  // CRUD
  const addProperty = async () => {
    if (!newPropertyName.trim()) return
    setProcessing('add-prop')
    const { data, error: e } = await (supabase as any).from('properties').insert({ name: newPropertyName.trim() } as any).select().single()
    if (e) { setError(e.message); setProcessing(null); return }
    setProperties(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewPropertyName('')
    setProcessing(null)
    showSuccess('Property added!')
  }

  const addLocation = async () => {
    if (!newLocationName.trim() || !newLocationPropId) return
    setProcessing('add-loc')
    const { data, error: e } = await (supabase as any)
      .from('locations')
      .insert({ name: newLocationName.trim(), property_id: newLocationPropId, is_approved: true } as any)
      .select('id, name, property_id, is_approved, created_at, properties(name)')
      .single()
    if (e) { setError(e.message); setProcessing(null); return }
    setLocations(prev => [...prev, data as Location].sort((a, b) => a.name.localeCompare(b.name)))
    setNewLocationName('')
    setProcessing(null)
    showSuccess('Location added!')
  }

  const addRole = async () => {
    if (!newRoleName.trim()) return
    setProcessing('add-role')
    const { data, error: e } = await (supabase as any).from('roles').insert({ name: newRoleName.trim(), is_approved: true } as any).select().single()
    if (e) { setError(e.message); setProcessing(null); return }
    setRoles(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewRoleName('')
    setProcessing(null)
    showSuccess('Role added!')
  }

  const saveEditInline = async (table: 'properties' | 'locations' | 'roles', id: string) => {
    if (!editingValue.trim()) { setEditingId(null); return }
    setProcessing(id)
    const { error: e } = await (supabase as any).from(table).update({ name: editingValue.trim() } as any).eq('id', id)
    if (e) { setError(e.message) } else {
      const newName = editingValue.trim()
      if (table === 'roles') setRoles(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r))
      else if (table === 'properties') setProperties(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p))
      else setLocations(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l))
      showSuccess('Updated!')
    }
    setEditingId(null)
    setProcessing(null)
  }

  const toggleLocationApproval = async (id: string, current: boolean) => {
    setProcessing(id)
    await (supabase as any).from('locations').update({ is_approved: !current } as any).eq('id', id)
    setLocations(prev => prev.map(l => l.id === id ? { ...l, is_approved: !current } : l))
    setProcessing(null)
  }

  const toggleRoleApproval = async (id: string, current: boolean) => {
    setProcessing(id)
    await (supabase as any).from('roles').update({ is_approved: !current } as any).eq('id', id)
    setRoles(prev => prev.map(r => r.id === id ? { ...r, is_approved: !current } : r))
    setProcessing(null)
  }

  const toggleUserActive = async (id: string, current: boolean) => {
    if (id === adminId) return
    setProcessing(id)
    await (supabase as any).from('users').update({ is_active: !current } as any).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !current } : u))
    setProcessing(null)
    showSuccess(current ? 'User deactivated.' : 'User reactivated.')
  }

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditingValue(name)
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'roles', label: 'Roles', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'properties', label: 'Properties', icon: <Building className="w-4 h-4" /> },
    { key: 'locations', label: 'Locations', icon: <MapPin className="w-4 h-4" /> },
    { key: 'cast', label: 'Cast', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-accent text-2xl font-bold text-text flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Admin Panel
        </h1>
        <p className="text-sm text-text/60">Manage roles, properties, locations, and cast</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-md bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />{success}
        </div>
      )}

      {/* Tabs with sliding indicator */}
      <div className="relative flex border-b border-border mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            ref={el => { tabRefs.current.set(t.key, el) }}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap min-h-0 min-w-0 transition-colors flex-1 justify-center',
              tab === t.key ? 'text-primary' : 'text-text/50 hover:text-text'
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
        <div
          className={cn('absolute bottom-0 h-0.5 bg-primary', indicatorReady && 'transition-all duration-200 ease-in-out')}
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      {/* Roles Tab */}
      {tab === 'roles' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="New role name..."
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole()}
            />
            <Button onClick={addRole} loading={processing === 'add-role'} size="sm" className="gap-1 shrink-0">
              <Plus className="w-4 h-4" />Add
            </Button>
          </div>
          <div className="space-y-2">
            {roles.map(r => (
              <div key={r.id} className="card flex items-center gap-4">
                {editingId === r.id ? (
                  <>
                    <input
                      className="input flex-1 text-sm"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEditInline('roles', r.id); if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => saveEditInline('roles', r.id)}
                        disabled={processing === r.id}
                        className="p-1.5 rounded text-success hover:bg-success/10 min-h-0 min-w-0 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded text-text/50 hover:bg-text/10 min-h-0 min-w-0 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-text flex-1">{r.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('badge text-xs', r.is_approved ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning')}>
                        {r.is_approved ? 'Approved' : 'Pending'}
                      </span>
                      <button
                        onClick={() => toggleRoleApproval(r.id, r.is_approved)}
                        disabled={processing === r.id}
                        className="p-1.5 text-text/50 hover:text-primary min-h-0 min-w-0 transition-colors"
                      >
                        {r.is_approved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => startEdit(r.id, r.name)}
                        className="p-1.5 text-text/50 hover:text-primary min-h-0 min-w-0 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Properties Tab */}
      {tab === 'properties' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="New property name..."
              value={newPropertyName}
              onChange={e => setNewPropertyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProperty()}
            />
            <Button onClick={addProperty} loading={processing === 'add-prop'} size="sm" className="gap-1 shrink-0">
              <Plus className="w-4 h-4" />Add
            </Button>
          </div>
          <div className="space-y-2">
            {properties.map(p => (
              <div key={p.id} className="card flex items-center gap-4">
                {editingId === p.id ? (
                  <>
                    <input
                      className="input flex-1 text-sm"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEditInline('properties', p.id); if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => saveEditInline('properties', p.id)}
                        disabled={processing === p.id}
                        className="p-1.5 rounded text-success hover:bg-success/10 min-h-0 min-w-0 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded text-text/50 hover:bg-text/10 min-h-0 min-w-0 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-text flex-1">{p.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-text/40">{new Date(p.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => startEdit(p.id, p.name)}
                        className="p-1.5 text-text/50 hover:text-primary min-h-0 min-w-0 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations Tab */}
      {tab === 'locations' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select className="input flex-1 min-w-40" value={newLocationPropId} onChange={e => setNewLocationPropId(e.target.value)}>
              <option value="">Select property...</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input
              className="input flex-1"
              placeholder="New location name..."
              value={newLocationName}
              onChange={e => setNewLocationName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLocation()}
            />
            <Button onClick={addLocation} loading={processing === 'add-loc'} size="sm" className="gap-1">
              <Plus className="w-4 h-4" />Add
            </Button>
          </div>
          <div className="space-y-2">
            {locations.map(l => (
              <div key={l.id} className="card flex items-center gap-4">
                {editingId === l.id ? (
                  <>
                    <input
                      className="input flex-1 text-sm"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEditInline('locations', l.id); if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => saveEditInline('locations', l.id)}
                        disabled={processing === l.id}
                        className="p-1.5 rounded text-success hover:bg-success/10 min-h-0 min-w-0 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded text-text/50 hover:bg-text/10 min-h-0 min-w-0 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text truncate">{l.name}</p>
                      <p className="text-xs text-text/50">{l.properties?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('badge text-xs', l.is_approved ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning')}>
                        {l.is_approved ? 'Approved' : 'Pending'}
                      </span>
                      <button
                        onClick={() => toggleLocationApproval(l.id, l.is_approved)}
                        disabled={processing === l.id}
                        className="p-1.5 text-text/50 hover:text-primary min-h-0 min-w-0 transition-colors"
                      >
                        {l.is_approved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => startEdit(l.id, l.name)}
                        className="p-1.5 text-text/50 hover:text-primary min-h-0 min-w-0 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cast Tab */}
      {tab === 'cast' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="p-4 bg-primary-light/40 rounded-lg space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                className="input text-sm h-9"
                value={filterCastRole}
                onChange={e => setFilterCastRole(e.target.value)}
              >
                <option value="">All Roles</option>
                {roles.filter(r => r.is_approved).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select
                className="input text-sm h-9"
                value={filterCastProperty}
                onChange={e => { setFilterCastProperty(e.target.value); setFilterCastLocation('') }}
              >
                <option value="">All Properties</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                className="input text-sm h-9"
                value={filterCastLocation}
                onChange={e => setFilterCastLocation(e.target.value)}
                disabled={!filterCastProperty}
              >
                <option value="">All Locations</option>
                {castFilterLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <select
                className="input text-sm h-9"
                value={filterCastUserType}
                onChange={e => setFilterCastUserType(e.target.value)}
              >
                <option value="">All Types</option>
                {userTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40 pointer-events-none" />
              <input
                className="input pl-9 text-sm"
                placeholder="Search by name..."
                value={castSearch}
                onChange={e => setCastSearch(e.target.value)}
              />
            </div>
          </div>

          {/* User list */}
          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-text/50 italic text-center py-8">No cast members match the current filters.</p>
            ) : (
              filteredUsers.map(u => {
                const uniqueRoleNames = [
                  ...new Set(
                    u.user_proficiencies
                      .map(p => p.roles?.name)
                      .filter((n): n is string => Boolean(n))
                  ),
                ].sort()

                return (
                  <div key={u.id} className="card flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className={cn('font-medium', u.is_active ? 'text-text' : 'text-text/40 line-through')}>
                          {u.display_name}
                        </p>
                        <Badge variant={userTypeVariant[u.user_type]}>{u.user_type}</Badge>
                        {!u.is_active && (
                          <span className="badge text-xs bg-warning/20 text-warning">Inactive</span>
                        )}
                      </div>
                      {uniqueRoleNames.length > 0 ? (
                        <p className="text-xs text-text/50">{uniqueRoleNames.join(' • ')}</p>
                      ) : (
                        <p className="text-xs text-text/40 italic">No Roles Yet</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {currentUserType === 'Admin' && u.id !== adminId && (
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/70 px-2 py-1 rounded border border-primary/30 hover:bg-primary-light transition-colors min-h-0"
                        >
                          <UserCog className="w-3.5 h-3.5" />Edit
                        </Link>
                      )}
                      {u.id !== adminId && (
                        <button
                          onClick={() => toggleUserActive(u.id, u.is_active)}
                          disabled={processing === u.id}
                          className={cn(
                            'badge text-xs cursor-pointer min-h-0 min-w-0 transition-colors',
                            u.is_active
                              ? 'bg-warning/20 text-warning hover:bg-warning/30'
                              : 'bg-success/20 text-success hover:bg-success/30'
                          )}
                        >
                          {u.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                      {u.id === adminId && (
                        <span className="text-xs text-text/40 italic">You</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
