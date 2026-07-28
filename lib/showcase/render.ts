import { formatInTimeZone } from 'date-fns-tz'
import {
  SHOWCASE_BOARDS, SHOWCASE_SHIFTS, SHOWCASE_REQUESTS, SHOWCASE_CONVERSATIONS,
  boardName,
  type ShowcaseShift, type ShowcaseRequest,
} from '@/lib/showcase/data'

const ET = 'America/New_York'

/**
 * Turns the relative fixtures in lib/showcase/data.ts into fully-formatted
 * view models.
 *
 * All of this runs on the server inside an RSC and is passed to the client as
 * plain strings. Formatting on the client instead would mean the demo renders
 * against the visitor's clock and timezone while the server rendered against
 * the build machine's — a guaranteed hydration mismatch on every card.
 */

function at(now: Date, dayOffset: number, hour: number): Date {
  const d = new Date(now)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, 0, 0, 0)
  return d
}

function timeLabel(d: Date): string {
  return formatInTimeZone(d, ET, 'h:mm a')
}

function durationLabel(startHour: number, endHour: number): string {
  const hours = endHour > startHour ? endHour - startHour : 24 - startHour + endHour
  return `${hours}h`
}

/** "in 2 days", "tomorrow" — the same human framing the real Wall uses. */
function relativeDayLabel(dayOffset: number): string {
  if (dayOffset === 0) return 'Today'
  if (dayOffset === 1) return 'Tomorrow'
  return `In ${dayOffset} days`
}

export interface ShiftView {
  id: string
  title: string
  poster: string
  boardName: string
  kind: 'trade' | 'giveaway'
  overtimeApproved: boolean
  details: string | null
  dateLabel: string
  relativeLabel: string
  startTime: string
  endTime: string
  duration: string
  interestedCount: number
  commentCount: number
  /** ISO date (yyyy-MM-dd) so the calendar can group without re-deriving it. */
  isoDate: string
}

export interface RequestView {
  id: string
  title: string
  poster: string
  boardName: string
  details: string | null
  dateLabel: string
  relativeLabel: string
  preferredTimes: string[]
  interestedCount: number
  isoDate: string
}

function toShiftView(s: ShowcaseShift, now: Date): ShiftView {
  const start = at(now, s.dayOffset, s.startHour)
  // A shift that ends earlier in the clock than it starts crossed midnight.
  const end = at(now, s.dayOffset + (s.endHour <= s.startHour ? 1 : 0), s.endHour)
  return {
    id: s.id,
    title: s.title,
    poster: s.poster,
    boardName: boardName(s.boardId),
    kind: s.kind,
    overtimeApproved: Boolean(s.overtimeApproved),
    details: s.details ?? null,
    dateLabel: formatInTimeZone(start, ET, 'EEE, MMM d'),
    relativeLabel: relativeDayLabel(s.dayOffset),
    startTime: timeLabel(start),
    endTime: timeLabel(end),
    duration: durationLabel(s.startHour, s.endHour),
    interestedCount: s.interestedCount,
    commentCount: s.commentCount,
    isoDate: formatInTimeZone(start, ET, 'yyyy-MM-dd'),
  }
}

function toRequestView(r: ShowcaseRequest, now: Date): RequestView {
  const day = at(now, r.dayOffset, 12)
  return {
    id: r.id,
    title: r.title,
    poster: r.poster,
    boardName: boardName(r.boardId),
    details: r.details ?? null,
    dateLabel: formatInTimeZone(day, ET, 'EEE, MMM d'),
    relativeLabel: relativeDayLabel(r.dayOffset),
    preferredTimes: r.preferredTimes,
    interestedCount: r.interestedCount,
    isoDate: formatInTimeZone(day, ET, 'yyyy-MM-dd'),
  }
}

export function getShowcaseWall(now = new Date()) {
  return {
    boards: SHOWCASE_BOARDS,
    shifts: SHOWCASE_SHIFTS.map(s => toShiftView(s, now)),
    requests: SHOWCASE_REQUESTS.map(r => toRequestView(r, now)),
  }
}

export interface CalendarDayView {
  isoDate: string
  dayOfMonth: number
  inMonth: boolean
  isToday: boolean
  shifts: { id: string; title: string; startTime: string; kind: 'trade' | 'giveaway' }[]
  requestCount: number
}

export interface CalendarMonthView {
  monthLabel: string
  weekdayLabels: string[]
  days: CalendarDayView[]
}

/**
 * A Sunday-aligned grid for the current month, with the sample shifts and
 * requests dropped onto their dates. Leading/trailing days from the
 * neighbouring months keep the grid rectangular, same as the real calendar.
 */
export function getShowcaseCalendar(now = new Date()): CalendarMonthView {
  const { shifts, requests } = getShowcaseWall(now)

  const shiftsByDate = new Map<string, ShiftView[]>()
  for (const s of shifts) {
    const list = shiftsByDate.get(s.isoDate) ?? []
    list.push(s)
    shiftsByDate.set(s.isoDate, list)
  }
  const requestsByDate = new Map<string, number>()
  for (const r of requests) {
    requestsByDate.set(r.isoDate, (requestsByDate.get(r.isoDate) ?? 0) + 1)
  }

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())

  const todayIso = formatInTimeZone(now, ET, 'yyyy-MM-dd')
  const days: CalendarDayView[] = []

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const iso = formatInTimeZone(d, ET, 'yyyy-MM-dd')
    days.push({
      isoDate: iso,
      dayOfMonth: d.getDate(),
      inMonth: d.getMonth() === now.getMonth(),
      isToday: iso === todayIso,
      shifts: (shiftsByDate.get(iso) ?? []).map(s => ({
        id: s.id, title: s.title, startTime: s.startTime, kind: s.kind,
      })),
      requestCount: requestsByDate.get(iso) ?? 0,
    })
  }

  return {
    monthLabel: formatInTimeZone(now, ET, 'MMMM yyyy'),
    weekdayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    days,
  }
}

export interface MessageView {
  id: string
  fromMe: boolean
  body: string
  timeLabel: string
}

export interface ConversationView {
  id: string
  withName: string
  withRole: string
  boardName: string
  subject: string
  unread: number
  preview: string
  lastActivity: string
  messages: MessageView[]
}

function agoLabel(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo}m ago`
  const hours = Math.round(minutesAgo / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

export function getShowcaseConversations(): ConversationView[] {
  return SHOWCASE_CONVERSATIONS.map(c => {
    const last = c.messages[c.messages.length - 1]
    return {
      id: c.id,
      withName: c.withName,
      withRole: c.withRole,
      boardName: boardName(c.boardId),
      subject: c.subject,
      unread: c.unread,
      preview: last.body,
      lastActivity: agoLabel(last.minutesAgo),
      messages: c.messages.map(m => ({
        id: m.id,
        fromMe: m.fromMe,
        body: m.body,
        timeLabel: agoLabel(m.minutesAgo),
      })),
    }
  })
}
