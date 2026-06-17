import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { FlagsClient } from './FlagsClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Flags – MyShiftX' }

export default async function FlagsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: isMod }] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase.rpc('is_any_board_moderator'),
  ])

  if (!profile || (profile.role !== 'Admin' && !isMod)) redirect('/wall')

  const { data: flags } = await supabase
    .from('flags')
    .select('id, target_type, target_id, reason, status, created_at, users!flagged_by_user_id(display_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return <FlagsClient
    flags={(flags ?? []) as { id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string; users: { display_name: string } | null }[]}
    resolverId={user.id}
  />
}
