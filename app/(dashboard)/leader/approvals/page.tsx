import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ApprovalsClient } from './ApprovalsClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Approvals – MyShiftX' }

interface PendingRequest {
  id: string
  board_id: string
  requested_at: string
  users: { display_name: string } | null
  boards: { name: string } | null
}

export default async function ApprovalsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check access: must be a board mod/leader or Admin
  const [{ data: profile }, { data: isMod }] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase.rpc('is_any_board_moderator'),
  ])

  const isAdmin = profile?.role === 'Admin'
  if (!isAdmin && !isMod) redirect('/wall')

  // RLS scopes this to boards where the viewer is a Mod/Leader (or Admin sees all)
  const { data: pendingRequests } = await supabase
    .from('user_boards')
    .select('id, board_id, requested_at, users(display_name), boards(name)')
    .eq('is_approved', false)
    .order('requested_at', { ascending: true })

  return (
    <ApprovalsClient
      pendingRequests={(pendingRequests ?? []) as PendingRequest[]}
      approverId={user.id}
    />
  )
}
