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

const ET = 'America/New_York'

interface Board { id: string; name: string }

interface WallClientProps {
  userId: string
  displayName: string
  boards: Board[]
  hasBoards: boolean
}

type Tab = 'offers' | 'requests'

export function WallClient({ userId, displayName, boards, hasBoards }: WallClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>('offers')
  const [shifts, setShifts] = useState<ShiftData[]>([])
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [boardFilter, setBoardFilter] = useState('')
  const [myPostsOnly, setMyPostsOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

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
    if (!hasBoards) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          id, shift_title, created_by, user_id, board_id,
          start_time, end_time, is_trade, is_giveaway, is_overtime_approved,
          details, is_active, expires_at, created_at,
          boards(name)
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error

      const mapped = (data ?? []).map((s: Record<string, unknown>) => ({
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
      }))
      setShifts(await attachCommentCounts(mapped, 'shift'))
    } finally {
      setLoading(false)
    }
  }, [hasBoards, attachCommentCounts, supabase])

  const loadRequests = useCallback(async () => {
    if (!hasBoards) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id, created_by, user_id, board_id, preferred_times, requested_date,
          details, is_active, expires_at, created_at,
          boards(name)
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('requested_date', { ascending: true })

      if (error) throw error

      const mapped = (data ?? []).map((r: Record<string, unknown>) => ({
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
      }))
      setRequests(await attachCommentCounts(mapped, 'request'))
    } finally {
      setLoading(false)
    }
  }, [hasBoards, attachCommentCounts, supabase])

  useEffect(() => {
    if (tab === 'offers') loadShifts()
    else loadRequests()
  }, [tab, loadShifts, loadRequests])

  const handleDeactivateShift = async (id: string) => {
    await supabase.from('shifts').update({ is_active: false }).eq('id', id).eq('user_id', userId)
    loadShifts()
  }

  const handleDeactivateRequest = async (id: string) => {
    await supabase.from('requests').update({ is_active: false }).eq('id', id).eq('user_id', userId)
    loadRequests()
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

  const currentPostCount = tab === 'offers' ? shifts.length : requests.length

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
                  <input
                    type="date"
                    className="input text-sm h-9"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                  />
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
                  className="input pl-9 text-sm"
                  placeholder={tab === 'offers' ? 'Search shifts...' : 'Search requests...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
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
            subtext={!hasBoards ? 'Join or create a board to see posts.' : 'Need a shift? Post a request!'}
            href={hasBoards ? '/wall/new-request' : '/profile'}
            btnLabel={hasBoards ? 'Post a Request' : 'Go to Profile'}
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
