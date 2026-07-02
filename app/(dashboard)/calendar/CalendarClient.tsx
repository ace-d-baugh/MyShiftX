'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Camera, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO, addMonths, startOfMonth, getDaysInMonth, getDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { getSettings, fmtTime, type UserSettings } from '@/lib/settings'
import { ScheduleImportModal } from '@/components/features/ScheduleImportModal'

const ET = 'America/New_York'

// ── Prop types ──────────────────────────────────────────────────────────────

interface MyShift {
  id: string; shift_title: string; start_time: string; end_time: string
  is_trade: boolean; is_giveaway: boolean; board_id: string | null
}
interface BoardShift {
  id: string; start_time: string; is_trade: boolean; is_giveaway: boolean; board_id: string | null
}
interface BoardRequest {
  id: string; requested_date: string; board_id: string | null
}

interface CalendarClientProps {
  userId: string
  displayName: string
  importEnabled: boolean
  today: string
  myShifts: MyShift[]
  boardShifts: BoardShift[]
  boardRequests: BoardRequest[]
}

// ── Day data ─────────────────────────────────────────────────────────────────

interface DayData {
  myShifts: MyShift[]
  hasTradeOnly: boolean
  hasGiveawayOnly: boolean
  hasBoth: boolean
  hasRequest: boolean
}

function buildDayMap(
  myShifts: MyShift[],
  boardShifts: BoardShift[],
  boardRequests: BoardRequest[]
): Map<string, DayData> {
  const map = new Map<string, DayData>()

  const ensure = (key: string) => {
    if (!map.has(key)) {
      map.set(key, { myShifts: [], hasTradeOnly: false, hasGiveawayOnly: false, hasBoth: false, hasRequest: false })
    }
    return map.get(key)!
  }

  myShifts.forEach(s => {
    const key = formatInTimeZone(parseISO(s.start_time), ET, 'yyyy-MM-dd')
    ensure(key).myShifts.push(s)
  })

  boardShifts.forEach(s => {
    const key = formatInTimeZone(parseISO(s.start_time), ET, 'yyyy-MM-dd')
    const d = ensure(key)
    if (s.is_trade && s.is_giveaway) d.hasBoth = true
    else if (s.is_trade)    d.hasTradeOnly    = true
    else if (s.is_giveaway) d.hasGiveawayOnly = true
  })

  boardRequests.forEach(r => {
    const d = ensure(r.requested_date)
    d.hasRequest = true
  })

  return map
}

// ── Calendar client ───────────────────────────────────────────────────────────

export function CalendarClient({ userId, displayName, importEnabled, today, myShifts, boardShifts, boardRequests }: CalendarClientProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => { setSettings(getSettings()) }, [])

  const todayDate = parseISO(today)
  const dayMap = buildDayMap(myShifts, boardShifts, boardRequests)

  const months = Array.from({ length: 4 }, (_, i) => addMonths(startOfMonth(todayDate), i))

  const weekStart = settings?.weekStart ?? 0
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const orderedDays = Array.from({ length: 7 }, (_, i) => DAY_LABELS[(i + weekStart) % 7])

  const todayStr = formatInTimeZone(todayDate, ET, 'yyyy-MM-dd')

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          <h1 className="font-accent text-2xl font-bold text-text">My Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          {importEnabled && (
            <button
              onClick={() => setImportOpen(true)}
              className="btn btn-outline gap-1.5 text-sm px-4 py-2 min-h-0 h-10"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Import Schedule</span>
              <span className="sm:hidden">Import</span>
            </button>
          )}
          <Link href="/wall/new-shift?from=calendar" className="btn btn-primary gap-1.5 text-sm px-4 py-2 min-h-0 h-10 no-underline">
            <Plus className="w-4 h-4" /> Add Shift
          </Link>
        </div>
      </div>

      {importEnabled && (
        <ScheduleImportModal
          userId={userId}
          displayName={displayName}
          open={importOpen}
          onClose={() => setImportOpen(false)}
        />
      )}

      {/* Dot legend */}
      <div className="flex items-center gap-5 mb-6 flex-wrap text-xs text-text/60">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />Trade + Giveaway</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-info inline-block" />Trade</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />Giveaway</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />Request</span>
      </div>

      <div className="space-y-10">
        {months.map(monthStart => {
          const year  = monthStart.getFullYear()
          const month = monthStart.getMonth()
          const daysInMonth = getDaysInMonth(monthStart)
          // Offset: how many blank cells before the 1st
          const firstDow  = getDay(monthStart) // 0=Sun … 6=Sat
          const offset    = (firstDow - weekStart + 7) % 7
          const cells     = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

          const monthLabel = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' })

          return (
            <div key={`${year}-${month}`}>
              <h2 className="font-accent text-lg font-bold text-text mb-3">{monthLabel}</h2>

              {/* Day-of-week header */}
              <div className="grid grid-cols-7 gap-px mb-px">
                {orderedDays.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-text/40 py-1">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {cells.map((day, idx) => {
                  if (!day) return <div key={`blank-${idx}`} className="bg-card min-h-[90px]" />

                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const data    = dayMap.get(dateStr)
                  const isToday = dateStr === todayStr
                  const isPast  = dateStr < todayStr

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        'bg-card p-1.5 min-h-[90px] flex flex-col',
                        isPast && 'opacity-50'
                      )}
                    >
                      {/* Day number */}
                      <span className={cn(
                        'text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full shrink-0',
                        isToday ? 'bg-primary text-white' : 'text-text/60'
                      )}>
                        {day}
                      </span>

                      {/* User's personal shifts */}
                      <div className="flex-1 space-y-0.5">
                        {(data?.myShifts ?? []).map(s => (
                          <button
                            key={s.id}
                            onClick={() => router.push(`/wall/edit-shift/${s.id}`)}
                            className={cn(
                              'w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight transition-colors border-l-2',
                              s.is_trade && s.is_giveaway ? 'border-l-primary bg-primary/5 hover:bg-primary/10' :
                              s.is_trade    ? 'border-l-info    bg-info/5    hover:bg-info/10'    :
                              s.is_giveaway ? 'border-l-success bg-success/5 hover:bg-success/10' :
                                              'border-l-text/20 bg-text/5   hover:bg-text/10'
                            )}
                          >
                            <div className="font-medium text-text truncate">{s.shift_title}</div>
                            <div className="text-text/50 tabular-nums">
                              {fmtTime(s.start_time, settings?.timeFormat ?? '12h')}–{fmtTime(s.end_time, settings?.timeFormat ?? '12h')}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Activity dots */}
                      {data && (data.hasBoth || data.hasTradeOnly || data.hasGiveawayOnly || data.hasRequest) && (
                        <div className="flex items-center gap-0.5 mt-1 flex-wrap">
                          {data.hasBoth && (
                            <button onClick={() => router.push(`/wall?tab=offers&date=${dateStr}`)} title="Trade + Giveaway on this day">
                              <span className="block w-2 h-2 rounded-full bg-primary hover:opacity-70 transition-opacity" />
                            </button>
                          )}
                          {data.hasTradeOnly && (
                            <button onClick={() => router.push(`/wall?tab=offers&date=${dateStr}`)} title="Trade shift on this day">
                              <span className="block w-2 h-2 rounded-full bg-info hover:opacity-70 transition-opacity" />
                            </button>
                          )}
                          {data.hasGiveawayOnly && (
                            <button onClick={() => router.push(`/wall?tab=offers&date=${dateStr}`)} title="Giveaway shift on this day">
                              <span className="block w-2 h-2 rounded-full bg-success hover:opacity-70 transition-opacity" />
                            </button>
                          )}
                          {data.hasRequest && (
                            <button onClick={() => router.push(`/wall?tab=requests&date=${dateStr}`)} title="Shift request on this day">
                              <span className="block w-2 h-2 rounded-full bg-accent hover:opacity-70 transition-opacity" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
