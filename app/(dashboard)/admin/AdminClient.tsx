'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Settings, LayoutGrid, Users, CheckCircle, Search, UserCog, ChevronDown, Check, Star, BarChart3 } from 'lucide-react'
import { setBoardActive, setUserActive } from '@/app/actions/admin'
import { Badge } from '@/components/ui/Badge'
import { AdminCharts } from './AdminCharts'
import { cn } from '@/lib/utils'
import type { GlobalRole, Membership, BillingCycle } from '@/lib/database.types'

type AdminTab = 'boards' | 'users' | 'charts'
export type MembershipFilterKey = 'free' | 'trial' | 'monthly' | 'semi_annual' | 'yearly'

interface Board {
  id: string
  name: string
  invite_code_enabled: boolean
  is_active: boolean
  created_at: string
}

export interface UserRow {
  id: string
  display_name: string | null
  role: string
  is_active: boolean
  created_at: string
  membership: Membership
  billing_cycle: BillingCycle | null
}

interface AdminClientProps {
  boards: Board[]
  users: UserRow[]
  adminId: string
}

const roleVariant: Record<GlobalRole, 'guest' | 'user' | 'admin'> = {
  Guest: 'guest', User: 'user', Admin: 'admin',
}

const globalRoleOptions: GlobalRole[] = ['Guest', 'User', 'Admin']

export const MEMBERSHIP_OPTIONS: { key: MembershipFilterKey; label: string }[] = [
  { key: 'free',         label: 'Free' },
  { key: 'trial',        label: 'Trial' },
  { key: 'monthly',      label: 'Monthly' },
  { key: 'semi_annual',  label: 'Semi-Annually' },
  { key: 'yearly',       label: 'Yearly' },
]

export function getMembershipKey(u: UserRow): MembershipFilterKey {
  if (u.membership === 'Basic') return 'free'
  if (u.membership === 'Trial') return 'trial'
  return (u.billing_cycle ?? 'monthly') as MembershipFilterKey
}

/** Small glance icon per membership tier — sized to match the other emoji. */
export function MembershipIcon({ user: u }: { user: UserRow }) {
  const key = getMembershipKey(u)
  if (key === 'free') {
    return (
      <Star
        fill="#ffea80"
        strokeWidth={0}
        className="w-4 h-4 rotate-[-30deg] text-[#FFEA80] shrink-0"
        aria-label="Free"
      />
    )
  }
  const emoji: Record<Exclude<MembershipFilterKey, 'free'>, string> = {
    trial: '⚖️',
    monthly: '📅',
    semi_annual: '🥈',
    yearly: '🏆',
  }
  return <span className="text-base leading-none shrink-0" role="img" aria-label={key}>{emoji[key]}</span>
}

export function AdminClient({ boards: initBoards, users: initUsers, adminId }: AdminClientProps) {
  const [tab, setTab] = useState<AdminTab>('users')
  const [boards, setBoards] = useState(initBoards)
  const [users, setUsers] = useState(initUsers)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Users tab filters
  const [userSearch, setUserSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [membershipFilters, setMembershipFilters] = useState<Set<MembershipFilterKey>>(new Set())
  const [membershipDropdownOpen, setMembershipDropdownOpen] = useState(false)
  const membershipDropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (membershipDropdownRef.current && !membershipDropdownRef.current.contains(e.target as Node)) {
        setMembershipDropdownOpen(false)
      }
    }
    if (membershipDropdownOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [membershipDropdownOpen])

  const toggleMembershipFilter = (key: MembershipFilterKey) => {
    setMembershipFilters(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (userSearch && !(u.display_name ?? '').toLowerCase().includes(userSearch.toLowerCase())) return false
      if (filterRole && u.role !== filterRole) return false
      if (membershipFilters.size > 0 && !membershipFilters.has(getMembershipKey(u))) return false
      return true
    })
  }, [users, userSearch, filterRole, membershipFilters])

  const toggleBoardActive = async (id: string, current: boolean) => {
    setProcessing(id)
    const { error: e } = await setBoardActive(id, !current)
    if (e) { setError(e) } else {
      setBoards(prev => prev.map(b => b.id === id ? { ...b, is_active: !current } : b))
      showSuccess(current ? 'Board deactivated.' : 'Board reactivated.')
    }
    setProcessing(null)
  }

  const toggleUserActive = async (id: string, current: boolean) => {
    if (id === adminId) return
    setProcessing(id)
    const { error: e } = await setUserActive(id, !current)
    if (e) { setError(e) } else {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !current } : u))
      showSuccess(current ? 'User deactivated.' : 'User reactivated.')
    }
    setProcessing(null)
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; count: number | null }[] = [
    { key: 'boards', label: 'Boards', icon: <LayoutGrid className="w-4 h-4" />, count: boards.length },
    { key: 'users',  label: 'Users',  icon: <Users className="w-4 h-4" />,     count: users.length },
    { key: 'charts', label: 'Charts', icon: <BarChart3 className="w-4 h-4" />, count: null },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-accent text-2xl font-bold text-text flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Admin Panel
        </h1>
        <p className="text-sm text-text/60">Manage boards and users</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">
          {error}
          <button className="ml-2 underline text-xs" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-md bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />{success}
        </div>
      )}

      {/* Tabs */}
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
            {t.count !== null && (
              <span
                className={cn(
                  'text-xs font-bold rounded-full px-2 py-0.5 leading-none',
                  tab === t.key ? 'bg-primary text-white' : 'bg-text/10 text-text/50'
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
        <div
          className={cn('absolute bottom-0 h-0.5 bg-primary', indicatorReady && 'transition-all duration-200 ease-in-out')}
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      {/* Boards Tab */}
      {tab === 'boards' && (
        <div className="space-y-2">
          {boards.length === 0 ? (
            <p className="text-sm text-text/50 italic text-center py-8">No boards yet.</p>
          ) : (
            boards.map(b => (
              <div key={b.id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={cn('font-medium text-text', !b.is_active && 'text-text/40 line-through')}>{b.name}</p>
                    {!b.is_active && <span className="badge text-xs bg-warning/20 text-warning">Inactive</span>}
                    {!b.invite_code_enabled && b.is_active && <span className="badge text-xs bg-text/10 text-text/50">Code Paused</span>}
                  </div>
                  <p className="text-xs text-text/40">{new Date(b.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => toggleBoardActive(b.id, b.is_active)}
                  disabled={processing === b.id}
                  className={cn(
                    'badge text-xs cursor-pointer min-h-0 min-w-0 transition-colors shrink-0',
                    b.is_active
                      ? 'bg-warning/20 text-warning hover:bg-warning/30'
                      : 'bg-success/20 text-success hover:bg-success/30'
                  )}
                >
                  {b.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 bg-primary-light/40 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                className="input text-sm h-9"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                {globalRoleOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              {/* Membership multi-select dropdown */}
              <div ref={membershipDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMembershipDropdownOpen(o => !o)}
                  className="input text-sm h-9 w-full flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="truncate text-left">
                    {membershipFilters.size === 0
                      ? 'All Memberships'
                      : membershipFilters.size === 1
                        ? (MEMBERSHIP_OPTIONS.find(o => membershipFilters.has(o.key))?.label ?? '1 selected')
                        : `${membershipFilters.size} selected`}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 shrink-0 text-text/40 transition-transform', membershipDropdownOpen && 'rotate-180')} />
                </button>

                {membershipDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[200px] bg-card border border-border rounded-lg shadow-lg py-1">
                    <button
                      type="button"
                      onClick={() => setMembershipFilters(new Set())}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-primary-light/40 transition-colors min-h-0 min-w-0"
                    >
                      <span className={cn('w-4 h-4 rounded border shrink-0 flex items-center justify-center', membershipFilters.size === 0 ? 'bg-primary border-primary' : 'border-border bg-background')}>
                        {membershipFilters.size === 0 && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className="font-medium">All Memberships</span>
                    </button>

                    {membershipFilters.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setMembershipFilters(new Set())}
                        className="w-full flex items-center px-3 py-1 text-xs text-primary hover:text-primary/70 transition-colors min-h-0 min-w-0"
                      >
                        Clear selection
                      </button>
                    )}

                    <div className="h-px bg-border mx-2 my-1" />

                    {MEMBERSHIP_OPTIONS.map(o => (
                      <button
                        key={o.key}
                        type="button"
                        onClick={() => toggleMembershipFilter(o.key)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-primary-light/40 transition-colors min-h-0 min-w-0"
                      >
                        <span className={cn('w-4 h-4 rounded border shrink-0 flex items-center justify-center', membershipFilters.has(o.key) ? 'bg-primary border-primary' : 'border-border bg-background')}>
                          {membershipFilters.has(o.key) && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="truncate">{o.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40 pointer-events-none" />
                <input
                  className="input pl-9 text-sm h-9"
                  placeholder="Search by name..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-text/50 italic text-center py-8">No users match.</p>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className="card flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <MembershipIcon user={u} />
                      <p className={cn('font-medium', u.is_active ? 'text-text' : 'text-text/40 line-through')}>
                        {u.display_name ?? <span className="italic text-text/40">No display name</span>}
                      </p>
                      <Badge variant={roleVariant[u.role as GlobalRole] ?? 'user'}>{u.role}</Badge>
                      {!u.is_active && <span className="badge text-xs bg-warning/20 text-warning">Inactive</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.id !== adminId && (
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/70 px-2 py-1 rounded border border-primary/30 hover:bg-primary-light transition-colors min-h-0"
                      >
                        <UserCog className="w-3.5 h-3.5" />Edit
                      </Link>
                    )}
                    {u.id !== adminId ? (
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
                    ) : (
                      <span className="text-xs text-text/40 italic">You</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {tab === 'charts' && <AdminCharts users={users} />}
    </div>
  )
}
