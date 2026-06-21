'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Plus, RefreshCw, Inbox, Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { deactivateShift, deactivateRequest } from '@/app/actions/posts'
import { ShiftCard, type ShiftData } from '@/components/features/ShiftCard'
import { RequestCard, type RequestData } from '@/components/features/RequestCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/lib/utils'

const ET = 'America/New_York'

interface Board { id: string; name: string }

interface WallClientProps {
  userId: string
  displayName: string
  boards: Board[]
  hasBoards: boolean
  initialTab?: Tab
  initialDate?: string
}

type Tab = 'offers' | 'requests'

export function WallClient({ userId, displayName, boards, hasBoards, initialTab = 'offers', initialDate = '' }: WallClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>(initialTab)
  const [shifts, setShifts] = useState<ShiftData[]>([])
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState(initialDate)
  const [boardFilter, setBoardFilter] = useState('')
  const [myPostsOnly, setMyPostsOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)

  // Collapsed state for day-group accordions, persisted per user
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`wall-collapsed-${userId}`)
      if (raw) setCollapsedKeys(new Set(JSON.parse(raw) as string[]))
    } catch {}
  }, [userId])

  const toggleCollapsed = useCallback((t: Tab, dayKey: string) => {
    const k = `${t}|${dayKey}`
    setCollapsedKeys(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      try {
        localStorage.setItem(`wall-collapsed-${userId}`, JSON.stringify([...next]))
      } catch {}
      return next
    })
  }, [userId])

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

  const loadShifts = useCallback(async (silent = false) => {
    if (!hasBoards) { if (!silent) setLoading(false); return }
    if (!silent) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          id, shift_title, created_by, user_id, board_id,
          start_time, end_time, is_trade, is_giveaway, is_overtime_approved,
          details, is_active, expires_at, created_at,
          boards(name),
          users!user_id(notify_via_email, notify_via_sms, phone_number)
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .or('is_trade.eq.true,is_giveaway.eq.true')
        .order('start_time', { ascending: true })

      if (error) throw error

      const mapped = (data ?? []).map((s: Record<string, unknown>) => {
        const poster = s.users as { notify_via_email: boolean; notify_via_sms: boolean; phone_number: string | null } | null
        return {
          id: s.id as string,
          shift_title: s.shift_title as string,
          created_by: s.created_by as string,
          user_id: s.user_id as string | null,
          board_id: s.board_id as string | null,
          board_name: (s.boards as { name: string } | null)?.name ?? '',
          start_time: s.start_time as string,
          end_time: s.end_time as string,
          is_trade: s.is_trade as boolean,
          is_giveaway: s.is_giveaway as boolean,
          is_overtime_approved: s.is_overtime_approved as boolean,
          details: s.details as string | null,
          is_active: s.is_active as boolean,
          expires_at: s.expires_at as string,
          created_at: s.created_at as string,
          contactReady: (poster?.notify_via_email ?? false) ||
                        ((poster?.notify_via_sms ?? false) && !!poster?.phone_number),
        }
      })
      setShifts(await attachCommentCounts(mapped, 'shift'))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [hasBoards, attachCommentCounts, supabase])

  const loadRequests = useCallback(async (silent = false) => {
    if (!hasBoards) { if (!silent) setLoading(false); return }
    if (!silent) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id, created_by, user_id, board_id, preferred_times, requested_date,
          details, is_active, expires_at, created_at,
          boards(name),
          users!user_id(notify_via_email, notify_via_sms, phone_number)
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('requested_date', { ascending: true })

      if (error) throw error

      const mapped = (data ?? []).map((r: Record<string, unknown>) => {
        const poster = r.users as { notify_via_email: boolean; notify_via_sms: boolean; phone_number: string | null } | null
        return {
          id: r.id as string,
          created_by: r.created_by as string,
          user_id: r.user_id as string | null,
          board_id: r.board_id as string | null,
          board_name: (r.boards as { name: string } | null)?.name ?? '',
          preferred_times: r.preferred_times as import('@/lib/database.types').PreferredTime[],
          requested_date: r.requested_date as string,
          details: r.details as string | null,
          is_active: r.is_active as boolean,
          expires_at: r.expires_at as string,
          created_at: r.created_at as string,
          contactReady: (poster?.notify_via_email ?? false) ||
                        ((poster?.notify_via_sms ?? false) && !!poster?.phone_number),
        }
      })
      setRequests(await attachCommentCounts(mapped, 'request'))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [hasBoards, attachCommentCounts, supabase])

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      loadShifts()
      loadRequests()
      return
    }
    if (tab === 'offers') loadShifts()
    else loadRequests()
  }, [tab, loadShifts, loadRequests])

  // Realtime subscriptions — silently refresh when posts are added, changed, or removed
  useEffect(() => {
    if (!hasBoards) return

    const shiftsChannel = supabase
      .channel('realtime:shifts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setShifts(prev => prev.filter(s => s.id !== (payload.old as { id: string }).id))
          } else if (payload.eventType === 'UPDATE' && !(payload.new as { is_active: boolean }).is_active) {
            setShifts(prev => prev.filter(s => s.id !== (payload.new as { id: string }).id))
          } else {
            loadShifts(true)
          }
        }
      )
      .subscribe()

    const requestsChannel = supabase
      .channel('realtime:requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== (payload.old as { id: string }).id))
          } else if (payload.eventType === 'UPDATE' && !(payload.new as { is_active: boolean }).is_active) {
            setRequests(prev => prev.filter(r => r.id !== (payload.new as { id: string }).id))
          } else {
            loadRequests(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(shiftsChannel)
      supabase.removeChannel(requestsChannel)
    }
  }, [hasBoards, supabase, loadShifts, loadRequests])

  const handleDeactivateShift = async (id: string) => {
    setDeactivateError(null)
    setShifts(prev => prev.filter(s => s.id !== id))
    const result = await deactivateShift(id)
    if (result.error) {
      setDeactivateError(result.error)
      loadShifts()
    }
  }

  const handleDeactivateRequest = async (id: string) => {
    setDeactivateError(null)
    setRequests(prev => prev.filter(r => r.id !== id))
    const result = await deactivateRequest(id)
    if (result.error) {
      setDeactivateError(result.error)
      loadRequests()
    }
  }

  const refresh = () => {
    if (tab === 'offers') loadShifts()
    else loadRequests()
  }

  const filteredShifts = useMemo(() => {
    let list = shifts
    if (myPostsOnly) list = list.filter(s => s.user_id === userId)
    if (boardFilter)  list = list.filter(s => s.board_id === boardFilter)
    if (dateFilter)   list = list.filter(s => formatInTimeZone(parseISO(s.start_time), ET, 'yyyy-MM-dd') === dateFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.shift_title.toLowerCase().includes(q) ||
        s.created_by.toLowerCase().includes(q) ||
        s.board_name.toLowerCase().includes(q) ||
        (s.details ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [shifts, search, dateFilter, boardFilter, myPostsOnly, userId])

  const filteredRequests = useMemo(() => {
    let list = requests
    if (myPostsOnly) list = list.filter(r => r.user_id === userId)
    if (boardFilter)  list = list.filter(r => r.board_id === boardFilter)
    if (dateFilter)   list = list.filter(r => r.requested_date === dateFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.created_by.toLowerCase().includes(q) ||
        r.board_name.toLowerCase().includes(q) ||
        (r.details ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [requests, search, dateFilter, boardFilter, myPostsOnly, userId])

  // Group shifts by their start date in ET
  const shiftDayGroups = useMemo(() => {
    const groups = new Map<string, { dayLabel: string; items: ShiftData[] }>()
    filteredShifts.forEach(shift => {
      const dayKey = formatInTimeZone(parseISO(shift.start_time), ET, 'yyyy-MM-dd')
      const dayLabel = formatInTimeZone(parseISO(shift.start_time), ET, 'EEEE, MMMM d, yyyy')
      if (!groups.has(dayKey)) groups.set(dayKey, { dayLabel, items: [] })
      groups.get(dayKey)!.items.push(shift)
    })
    return [...groups.entries()].map(([dayKey, v]) => ({ dayKey, ...v }))
  }, [filteredShifts])

  // Group requests by requested_date
  const requestDayGroups = useMemo(() => {
    const groups = new Map<string, { dayLabel: string; items: RequestData[] }>()
    filteredRequests.forEach(req => {
      const dayKey = req.requested_date
      // Use noon UTC so ET conversion never crosses a date boundary
      const dayLabel = formatInTimeZone(req.requested_date + 'T12:00:00Z', ET, 'EEEE, MMMM d, yyyy')
      if (!groups.has(dayKey)) groups.set(dayKey, { dayLabel, items: [] })
      groups.get(dayKey)!.items.push(req)
    })
    return [...groups.entries()].map(([dayKey, v]) => ({ dayKey, ...v }))
  }, [filteredRequests])

  const currentPostCount = tab === 'offers' ? shifts.length : requests.length

  const tabLabel = (t: Tab) => {
    const count = t === 'offers' ? filteredShifts.length : filteredRequests.length
    return (
      <span className="flex items-center gap-1.5">
        {t === 'offers' ? 'Shift Offers' : 'Shift Requests'}
        <span className={cn(
          'text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-none',
          tab === t ? 'bg-primary/20 text-primary' : 'bg-text/10 text-text/50'
        )}>
          {count}
        </span>
      </span>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-accent text-2xl font-bold text-text">The Wall</h1>
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
          {hasBoards && (
            <Link
              href={tab === 'offers' ? '/wall/new-shift' : '/wall/new-request'}
              className="btn btn-primary gap-1.5 text-sm px-4 py-2 min-h-0 h-10"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{tab === 'offers' ? 'Post Shift' : 'Post Request'}</span>
              <span className="sm:hidden">{tab === 'offers' ? 'Offer' : 'Request'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Deactivate error */}
      {deactivateError && (
        <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm flex items-center justify-between">
          <span>{deactivateError}</span>
          <button onClick={() => setDeactivateError(null)} className="ml-2 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border mb-5">
        {(['offers', 'requests'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px min-h-0 min-w-0',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-text/50 hover:text-text'
            )}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {/* Filters */}
      {currentPostCount > 1 && (
        <>
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mb-4 min-h-0 min-w-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            <ChevronDown className={cn('w-4 h-4 transition-transform', filtersOpen && 'rotate-180')} />
          </button>

          {filtersOpen && (
            <div className="mb-6 p-4 bg-primary-light/40 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text/60 mb-1">Board</label>
                  <select
                    className="input text-sm h-9"
                    value={boardFilter}
                    onChange={e => setBoardFilter(e.target.value)}
                  >
                    <option value="">All Boards</option>
                    {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text/60 mb-1">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="input text-sm h-9 pr-8"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                    />
                    {dateFilter && (
                      <button
                        type="button"
                        onClick={() => setDateFilter('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text/40 hover:text-text min-h-0 min-w-0 p-0.5"
                        aria-label="Clear date"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer min-h-0">
                    <Checkbox
                      checked={myPostsOnly}
                      onChange={e => setMyPostsOnly(e.target.checked)}
                    />
                    <span className="text-sm text-text whitespace-nowrap">My posts only</span>
                  </label>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40 pointer-events-none" />
                <input
                  className="input pl-9 pr-8 text-sm"
                  placeholder={tab === 'offers' ? 'Search shifts...' : 'Search requests...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text/40 hover:text-text min-h-0 min-w-0 p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
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
            subtext={!hasBoards ? 'Join or create a board to see posts.' : 'Be the first to post a shift!'}
            href={hasBoards ? '/wall/new-shift' : '/profile'}
            btnLabel={hasBoards ? 'Post a Shift' : 'Go to Profile'}
          />
        ) : filteredShifts.length === 0 ? (
          <div className="text-center py-16 px-4 text-text/50 text-sm">
            {search.trim() ? <>No shifts match &ldquo;{search}&rdquo;.</> : 'No shifts match your filters.'}
          </div>
        ) : (
          <div className="space-y-5">
            {shiftDayGroups.map((group, gi) => (
              <div
                key={group.dayKey}
                className="animate-fade-in-up"
                style={{ animationDelay: `${gi * 60}ms` }}
              >
                <DayGroup
                  dayLabel={group.dayLabel}
                  count={group.items.length}
                  isCollapsed={collapsedKeys.has(`offers|${group.dayKey}`)}
                  onToggle={() => toggleCollapsed('offers', group.dayKey)}
                >
                  {group.items.map((shift, ci) => (
                    <div
                      key={shift.id}
                      className="animate-card-in"
                      style={{ animationDelay: `${Math.min(gi * 60 + ci * 45, 480)}ms` }}
                    >
                      <ShiftCard
                        shift={shift}
                        currentUserId={userId}
                        currentUserName={displayName}
                        onDeactivate={handleDeactivateShift}
                      />
                    </div>
                  ))}
                </DayGroup>
              </div>
            ))}
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <EmptyState
            message="No shift requests found"
            subtext={!hasBoards ? 'Join or create a board to see posts.' : 'Need a shift? Post a request!'}
            href={hasBoards ? '/wall/new-request' : '/profile'}
            btnLabel={hasBoards ? 'Post a Request' : 'Go to Profile'}
          />
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4 text-text/50 text-sm">
            {search.trim() ? <>No requests match &ldquo;{search}&rdquo;.</> : 'No requests match your filters.'}
          </div>
        ) : (
          <div className="space-y-5">
            {requestDayGroups.map((group, gi) => (
              <div
                key={group.dayKey}
                className="animate-fade-in-up"
                style={{ animationDelay: `${gi * 60}ms` }}
              >
                <DayGroup
                  dayLabel={group.dayLabel}
                  count={group.items.length}
                  isCollapsed={collapsedKeys.has(`requests|${group.dayKey}`)}
                  onToggle={() => toggleCollapsed('requests', group.dayKey)}
                >
                  {group.items.map((request, ci) => (
                    <div
                      key={request.id}
                      className="animate-card-in"
                      style={{ animationDelay: `${Math.min(gi * 60 + ci * 45, 480)}ms` }}
                    >
                      <RequestCard
                        request={request}
                        currentUserId={userId}
                        currentUserName={displayName}
                        onDeactivate={handleDeactivateRequest}
                      />
                    </div>
                  ))}
                </DayGroup>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// ── Day-group accordion ────────────────────────────────────────────────────────

function DayGroup({
  dayLabel, count, isCollapsed, onToggle, children,
}: {
  dayLabel: string
  count: number
  isCollapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-primary-light/30 active:bg-primary-light/50 transition-colors duration-150 min-h-0"
        aria-expanded={!isCollapsed}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="font-accent font-bold text-text text-sm truncate">{dayLabel}</span>
          <span className="text-[11px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full shrink-0 leading-none">
            {count}
          </span>
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-text/40 transition-transform duration-300 ease-spring shrink-0',
          !isCollapsed && 'rotate-180'
        )} />
      </button>

      {/* Animated content — grid-rows trick avoids JS height measurement */}
      <div className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-spring',
        isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
      )}>
        <div className="overflow-hidden">
          <div className="max-h-[68rem] overflow-y-auto scrollbar-thin">
            <div className="p-4 space-y-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ message, subtext, href, btnLabel }: {
  message: string; subtext: string; href: string; btnLabel: string
}) {
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
