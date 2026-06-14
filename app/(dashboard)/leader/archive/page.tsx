import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ArchiveClient } from './ArchiveClient'
import type { UserType } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Archive – WDWShiftX' }

type ProfileRow = { user_type: UserType } | null

export default async function ArchivePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users').select('user_type').eq('id', user.id).single() as unknown as { data: ProfileRow }

  if (!userProfile || !(['Leader', 'Admin'] as UserType[]).includes(userProfile.user_type)) {
    redirect('/board')
  }

  const { data: archivedShifts } = await supabase
    .from('shifts')
    .select('id, shift_title, created_by, start_time, end_time, is_trade, is_giveaway, is_overtime_approved, created_at, properties(name), locations(name), roles(name)')
    .eq('is_active', false)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: archivedRequests } = await supabase
    .from('requests')
    .select('id, created_by, requested_date, preferred_times, created_at, properties(name), locations(name), roles(name)')
    .eq('is_active', false)
    .order('created_at', { ascending: false })
    .limit(50)

  return <ArchiveClient
    archivedShifts={(archivedShifts ?? []) as { id: string; shift_title: string; created_by: string; start_time: string; end_time: string; is_trade: boolean; is_giveaway: boolean; is_overtime_approved: boolean; created_at: string; properties: { name: string } | null; locations: { name: string } | null; roles: { name: string } | null }[]}
    archivedRequests={(archivedRequests ?? []) as { id: string; created_by: string; requested_date: string; preferred_times: string[]; created_at: string; properties: { name: string } | null; locations: { name: string } | null; roles: { name: string } | null }[]}
  />
}
