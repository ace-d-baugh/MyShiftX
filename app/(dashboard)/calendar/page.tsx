import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { CalendarClient } from './CalendarClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Calendar – MyShiftX' }

export default async function CalendarPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Date window: start of this month → end of month+3
  const now = new Date()
  const windowStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 4, 0)
  const windowEnd = new Date(endMonth.getFullYear(), endMonth.getMonth(), endMonth.getDate(), 23, 59, 59).toISOString()

  // User's own shifts (all types — personal calendar entries)
  const { data: myShifts } = await supabase
    .from('shifts')
    .select('id, shift_title, start_time, end_time, is_trade, is_giveaway, board_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('start_time', windowStart)
    .lte('start_time', windowEnd)
    .order('start_time', { ascending: true })

  // Board-level public shifts for dots (all boards the user belongs to)
  const { data: boardShifts } = await supabase
    .from('shifts')
    .select('id, start_time, is_trade, is_giveaway, board_id')
    .eq('is_active', true)
    .or('is_trade.eq.true,is_giveaway.eq.true')
    .gte('start_time', windowStart)
    .lte('start_time', windowEnd)
    .gt('expires_at', now.toISOString())

  // Board-level requests for dots
  const { data: boardRequests } = await supabase
    .from('requests')
    .select('id, requested_date, board_id')
    .eq('is_active', true)
    .gte('requested_date', windowStart.split('T')[0])
    .lte('requested_date', windowEnd.split('T')[0])
    .gt('expires_at', now.toISOString())

  return (
    <CalendarClient
      userId={user.id}
      today={now.toISOString()}
      myShifts={(myShifts ?? []) as {
        id: string; shift_title: string; start_time: string; end_time: string
        is_trade: boolean; is_giveaway: boolean; board_id: string | null
      }[]}
      boardShifts={(boardShifts ?? []) as {
        id: string; start_time: string; is_trade: boolean; is_giveaway: boolean; board_id: string | null
      }[]}
      boardRequests={(boardRequests ?? []) as { id: string; requested_date: string; board_id: string | null }[]}
    />
  )
}
