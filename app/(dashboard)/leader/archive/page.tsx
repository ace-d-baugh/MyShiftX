import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ArchiveClient } from './ArchiveClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Archive – MyShiftX' }

export default async function ArchivePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: isMod }] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase.rpc('is_any_board_moderator'),
  ])

  if (!profile || (profile.role !== 'Admin' && !isMod)) redirect('/wall')

  const [{ data: archivedShifts }, { data: archivedRequests }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, shift_title, created_by, start_time, end_time, is_trade, is_giveaway, is_overtime_approved, created_at, boards(name)')
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('requests')
      .select('id, created_by, requested_date, preferred_times, created_at, boards(name)')
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return <ArchiveClient
    archivedShifts={(archivedShifts ?? []) as { id: string; shift_title: string; created_by: string; start_time: string; end_time: string; is_trade: boolean; is_giveaway: boolean; is_overtime_approved: boolean; created_at: string; boards: { name: string } | null }[]}
    archivedRequests={(archivedRequests ?? []) as { id: string; created_by: string; requested_date: string; preferred_times: string[]; created_at: string; boards: { name: string } | null }[]}
  />
}
