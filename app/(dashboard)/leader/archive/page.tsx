import { requireModeratorOrAdmin } from '@/lib/auth/session'
import { ArchiveClient } from './ArchiveClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Archive – MyShiftX' }

export default async function ArchivePage() {
  const { supabase } = await requireModeratorOrAdmin()

  const now = new Date().toISOString()

  const [{ data: archivedShifts }, { data: archivedRequests }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, shift_title, created_by, start_time, end_time, is_trade, is_giveaway, is_overtime_approved, created_at, boards(name)')
      .or(`is_active.eq.false,expires_at.lte.${now}`)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('requests')
      .select('id, created_by, requested_date, preferred_times, created_at, boards(name)')
      .or(`is_active.eq.false,expires_at.lte.${now}`)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return <ArchiveClient
    archivedShifts={(archivedShifts ?? []) as { id: string; shift_title: string; created_by: string; start_time: string; end_time: string; is_trade: boolean; is_giveaway: boolean; is_overtime_approved: boolean; created_at: string; boards: { name: string } | null }[]}
    archivedRequests={(archivedRequests ?? []) as { id: string; created_by: string; requested_date: string; preferred_times: string[]; created_at: string; boards: { name: string } | null }[]}
  />
}
