'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Plus, RefreshCw, Inbox, Search, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ShiftCard, type ShiftData } from '@/components/features/ShiftCard'
import { RequestCard, type RequestData } from '@/components/features/RequestCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/lib/utils'
import type { UserType } from '@/lib/database.types'

const ET = 'America/New_York'

interface UniqueItem { id: string; name: string }
interface UniqueLocation { id: string; name: string; property_id: string }
interface ProficiencyEntry { role_id: string; location_id: string; property_id: string }

interface BoardClientProps {
  userId: string
  displayName: string
  userRole: UserType
  isAdmin: boolean
  uniqueRoles: UniqueItem[]
  uniqueProperties: UniqueItem[]
  uniqueLocations: UniqueLocation[]
  proficiencyEntries: ProficiencyEntry[]
  hasProficiencies: boolean
}

type Tab = 'offers' | 'requests'

export function BoardClient({
  userId,
  displayName,
  userRole: _userRole,
  isAdmin,
  uniqueRoles,
  uniqueProperties,
  uniqueLocations,
  proficiencyEntries: _proficiencyEntries,
  hasProficiencies,
}: BoardClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>('offers')
  const [shifts, setShifts] = useState<ShiftData[]>([])
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [myPostsOnly, setMyPostsOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Admin: single-select filters
  const [adminFilterProperty, setAdminFilterProperty] = useState('')
  const [adminFilterLocation, setAdminFilterLocation] = useState('')
  const [adminFilterRole, setAdminFilterRole] = useState('')

  // Non-admin: multi-select checkbox filters (default all checked)
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(
    () => new Set(uniqueRoles.map(r => r.id))
  )
  const [scopePropertyId, setScopePropertyId] = useState('')
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(
    () => new Set(uniqueLocations.map(l => l.id))
  )

  const adminFilteredLocations = uniqueLocations.filter(
    l => !adminFilterProperty || l.property_id === adminFilterProperty
  )

  const visibleFilterLocations = scopePropertyId
    ? uniqueLocations.filter(l => l.property_id === scopePropertyId)
    : uniqueLocations

  const toggleRole = (id: string) => {
    setSelectedRoleIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleLocation = (id: string) => {
    setSelectedLocationIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const attachCommentCounts = useCallback(async <T extends { id: string }>(
    items: T[],
    postType: 'shift' | 'request'
  ): Promise<(T & { comment_count: number; interested_count: number })[]> => {
    if (items.length === 0) return []
    const ids = items.map(i => i.id)
    const { data } = await supabase
      .from('comments')
      .select('post_id, user_id, is_interested')
      .eq('post_type', postType)
      .eq('is_active', true)
      .in('post_id', ids)

    const counts = new Map<string, { total: number; interested: Set<string> }>()
    ;(data ?? []).forEach((c: { post_id: string; user_id: string | null; is_interested: boolean }) => {
      const entry = counts.get(c.post_id) ?? { total: 0, interested: new Set<string>() }
      entry.total += 1
      if (c.is_interested && c.user_id) entry.interested.add(c.user_id)
      counts.set(c.post_id, entry)
    })

    return items.map(i => ({
      ...i,
      comment_count: counts.get(i.id)?.total ?? 0,
      interested_count: counts.get(i.id)?.interested.size ?? 0,
    }))
  }, [supabase])

  const loadShifts = useCallback(async () => {
    if (!hasProficiencies) { setLoading(false); return }
    setLoading(true)
    try {
      let query = supabase
        .from('shifts')
        .select(`
          id, shift_title, created_by, user_id, start_time, end_time,
          is_trade, is_giveaway, is_overtime_approved, details, is_active, expires_at, created_at,
          properties(name), locations(name), roles(name)
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (isAdmin) {
        if (adminFilterProperty) query = query.eq('property_id', adminFilterProperty)
        if (adminFilterLocation) query = query.eq('location_id', adminFilterLocation)
        if (adminFilterRole) query = query.eq('role_id', adminFilterRole)
      } else {
        const roleIds = [...selectedRoleIds]
        const locationIds = [...selectedLocationIds]
        if (roleIds.length === 0 || locationIds.length === 0) { setShifts([]); setLoading(false); return }
        query = query.in('role_id', roleIds).in('location_id', locationIds)
      }

      const { data, error } = await query
      if (error) throw error

      const mapped = (data ?? []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        shift_title: s.shift_title as string,
        created_by: s.created_by as string,
        user_id: s.user_id as string | null,
        property_name: (s.properties as { name: string } | null)?.name ?? '',
        location_name: (s.locations as { name: string } | null)?.name ?? '',
        role_name: (s.roles as { name: string } | null)?.name ?? '',
        start_time: s.start_time as string,
        end_time: s.end_time as string,
        is_trade: s.is_trade as boolean,
        is_giveaway: s.is_giveaway as boolean,
        is_overtime_approved: s.is_overtime_approved as boolean,
        details: s.details as string | null,
        is_active: s.is_active as boolean,
        expires_at: s.expires_at as string,
        created_at: s.created_at as string,
      }))
      setShifts(await attachCommentCounts(mapped, 'shift'))
    } finally {
      setLoading(false)
    }
  }, [isAdmin, hasProficiencies, adminFilterProperty, adminFilterLocation, adminFilterRole, selectedRoleIds, selectedLocationIds, attachCommentCounts])

  const loadRequests = useCallback(async () => {
    if (!hasProficiencies) { setLoading(false); return }
    setLoading(true)
    try {
      let query = supabase
        .from('requests')
        .select(`
          id, created_by, user_id, preferred_times, requested_date,
          details, is_active, expires_at, created_at,
          properties(name), locations(name), roles(name)
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('requested_date', { ascending: true })

      if (isAdmin) {
        if (adminFilterProperty) query = query.eq('property_id', adminFilterProperty)
        if (adminFilterLocation) query = query.eq('location_id', adminFilterLocation)
        if (adminFilterRole) query = query.eq('role_id', adminFilterRole)
      } else {
        const roleIds = [...selectedRoleIds]
        const locationIds = [...selectedLocationIds]
        if (roleIds.length === 0 || locationIds.length === 0) { setRequests([]); setLoading(false); return }
        query = query.in('role_id', roleIds).in('location_id', locationIds)
      }

      const { data, error } = await query
      if (error) throw error

      const mapped = (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        created_by: r.created_by as string,
        user_id: r.user_id as string | null,
        property_name: (r.properties as { name: string } | null)?.name ?? '',
        location_name: (r.locations as { name: string } | null)?.name ?? '',
        role_name: (r.roles as { name: string } | null)?.name ?? '',
        preferred_times: r.preferred_times as import('@/lib/database.types').PreferredTime[],
        requested_date: r.requested_date as string,
        details: r.details as string | null,
        is_active: r.is_active as boolean,
        expires_at: r.expires_at as string,
        created_at: r.created_at as string,
      }))
      setRequests(await attachCommentCounts(mapped, 'request'))
    } finally {
      setLoading(false)
    }
  }, [isAdmin, hasProficiencies, adminFilterProperty, adminFilterLocation, adminFilterRole, selectedRoleIds, selectedLocationIds, attachCommentCounts])

  useEffect(() => {
    if (tab === 'offers') loadShifts()
    else loadRequests()
  }, [tab, loadShifts, loadRequests])

  const handleDeactivateShift = async (id: string) => {
    await (supabase as any).from('shifts').update({ is_active: false } as any).eq('id', id).eq('user_id', userId)
    loadShifts()
  }

  const handleDeactivateRequest = async (id: string) => {
    await (supabase as any).from('requests').update({ is_active: false } as any).eq('id', id).eq('user_id', userId)
    loadRequests()
  }

  const refresh = () => {
    if (tab === 'offers') loadShifts()
    else loadRequests()
  }

  const filteredShifts = useMemo(() => {
    let list = shifts
    if (myPostsOnly) list = list.filter(s => s.user_id === userId)
    if (dateFilter) {
      list = list.filter(s => formatInTimeZone(parseISO(s.start_time), ET, 'yyyy-MM-dd') === dateFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.shift_title.toLowerCase().includes(q) ||
        s.created_by.toLowerCase().includes(q) ||
        s.property_name.toLowerCase().includes(q) ||
        s.location_name.toLowerCase().includes(q) ||
        s.role_name.toLowerCase().includes(q) ||
        (s.details ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [shifts, search, dateFilter, myPostsOnly, userId])

  const filteredRequests = useMemo(() => {
    let list = requests
    if (myPostsOnly) list = list.filter(r => r.user_id === userId)
    if (dateFilter) list = list.filter(r => r.requested_date === dateFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.created_by.toLowerCase().includes(q) ||
        r.property_name.toLowerCase().includes(q) ||
        r.location_name.toLowerCase().includes(q) ||
        r.role_name.toLowerCase().includes(q) ||
        (r.details ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [requests, search, dateFilter, myPostsOnly, userId])

  const currentPostCount = tab === 'offers' ? shifts.length : requests.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-accent text-2xl font-bold text-text">Shift Board</h1>
          <p className="text-sm text-text/60">Browse and post shift offers and requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-md text-text/50 hover:text-primary hover:bg-primary-light transition-colors min-h-0 min-w-0"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {hasProficiencies && (
            <Link
              href={tab === 'offers' ? '/board/new-shift' : '/board/new-request'}
              className="btn btn-primary gap-1.5 text-sm px-4 py-2 min-h-0 h-10"
            >
              <Plus className="w-4 h-4" />
              {tab === 'offers' ? 'Post Shift' : 'Post Request'}
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-5">
        {(['offers', 'requests'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px capitalize min-h-0 min-w-0',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-text/50 hover:text-text'
            )}
          >
            {t === 'offers' ? 'Shift Offers' : 'Shift Requests'}
          </button>
        ))}
      </div>

      {currentPostCount > 1 && (
      <>
      {/* Filters toggle */}
      <button
        onClick={() => setFiltersOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mb-4 min-h-0 min-w-0"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
        <ChevronDown className={cn('w-4 h-4 transition-transform', filtersOpen && 'rotate-180')} />
      </button>

      {filtersOpen && (
        isAdmin ? (
        /* Admin: single-select dropdowns across all properties/locations/roles */
        <div className="mb-6 p-4 bg-primary-light/40 rounded-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-text/60 mb-1">Role</label>
              <select
                className="input text-sm h-9"
                value={adminFilterRole}
                onChange={e => setAdminFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                {uniqueRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text/60 mb-1">Property</label>
              <select
                className="input text-sm h-9"
                value={adminFilterProperty}
                onChange={e => { setAdminFilterProperty(e.target.value); setAdminFilterLocation('') }}
              >
                <option value="">All Properties</option>
                {uniqueProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text/60 mb-1">Location</label>
              <select
                className="input text-sm h-9"
                value={adminFilterLocation}
                onChange={e => setAdminFilterLocation(e.target.value)}
                disabled={!adminFilterProperty}
              >
                <option value="">All Locations</option>
                {adminFilteredLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text/60 mb-1">Date</label>
              <input
                type="date"
                className="input text-sm h-9"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40 pointer-events-none" />
              <input
                className="input pl-9 text-sm"
                placeholder={tab === 'offers' ? 'Search shifts...' : 'Search requests...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer min-h-0 shrink-0 px-1">
              <Checkbox
                checked={myPostsOnly}
                onChange={e => setMyPostsOnly(e.target.checked)}
              />
              <span className="text-sm text-text whitespace-nowrap">My posts only</span>
            </label>
          </div>
        </div>
      ) : (
        /* Cast/Mod/Leader: multi-select checkboxes from proficiencies */
        <div className="mb-6 p-4 bg-primary-light/40 rounded-lg space-y-4">
          {uniqueRoles.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text/60 mb-2">Role</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {uniqueRoles.map(r => (
                  <label key={r.id} className="flex items-center gap-1.5 cursor-pointer min-h-0">
                    <Checkbox
                      checked={selectedRoleIds.has(r.id)}
                      onChange={() => toggleRole(r.id)}
                    />
                    <span className="text-sm text-text">{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {uniqueProperties.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text/60 mb-1">Property</label>
              <select
                className="input text-sm h-9"
                value={scopePropertyId}
                onChange={e => setScopePropertyId(e.target.value)}
              >
                <option value="">All Properties</option>
                {uniqueProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {visibleFilterLocations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text/60 mb-2">Location</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {visibleFilterLocations.map(l => (
                  <label key={l.id} className="flex items-center gap-1.5 cursor-pointer min-h-0">
                    <Checkbox
                      checked={selectedLocationIds.has(l.id)}
                      onChange={() => toggleLocation(l.id)}
                    />
                    <span className="text-sm text-text">{l.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text/60 mb-1">Date</label>
            <input
              type="date"
              className="input text-sm h-9"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40 pointer-events-none" />
              <input
                className="input pl-9 text-sm"
                placeholder={tab === 'offers' ? 'Search shifts...' : 'Search requests...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer min-h-0 shrink-0 px-1">
              <Checkbox
                checked={myPostsOnly}
                onChange={e => setMyPostsOnly(e.target.checked)}
              />
              <span className="text-sm text-text whitespace-nowrap">My posts only</span>
            </label>
          </div>
        </div>
        )
      )}
      </>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : tab === 'offers' ? (
        shifts.length === 0 ? (
          <EmptyState
            message="No shift offers found"
            subtext={
              !hasProficiencies
                ? 'Try adjusting your proficiencies.'
                : 'Be the first to post a shift!'
            }
            href={hasProficiencies ? '/board/new-shift' : '/profile'}
            btnLabel={hasProficiencies ? 'Post a Shift' : 'Add Proficiencies'}
          />
        ) : filteredShifts.length === 0 ? (
          <div className="text-center py-16 px-4 text-text/50 text-sm">
            {search.trim() ? <>No shifts match &ldquo;{search}&rdquo;.</> : 'No shifts match your filters.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShifts.map(shift => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                currentUserId={userId}
                currentUserName={displayName}
                onDeactivate={handleDeactivateShift}
              />
            ))}
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <EmptyState
            message="No shift requests found"
            subtext={
              !hasProficiencies
                ? 'Try adjusting your proficiencies.'
                : 'Need a shift? Post a request!'
            }
            href={hasProficiencies ? '/board/new-request' : '/profile'}
            btnLabel={hasProficiencies ? 'Post a Request' : 'Add Proficiencies'}
          />
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4 text-text/50 text-sm">
            {search.trim() ? <>No requests match &ldquo;{search}&rdquo;.</> : 'No requests match your filters.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                currentUserId={userId}
                currentUserName={displayName}
                onDeactivate={handleDeactivateRequest}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function EmptyState({ message, subtext, href, btnLabel }: { message: string; subtext: string; href: string; btnLabel: string }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
        <Inbox className="w-8 h-8 text-primary/50" />
      </div>
      <h3 className="font-accent text-xl font-bold text-text mb-2">{message}</h3>
      <p className="text-text/50 text-sm mb-6">{subtext}</p>
      <Link href={href} className="btn btn-primary gap-1.5">
        <Plus className="w-4 h-4" /> {btnLabel}
      </Link>
    </div>
  )
}
