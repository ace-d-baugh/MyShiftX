import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { BoardsClient } from '../BoardsClient'
import { groupMembersByBoard } from '../utils'
import type { ManagedBoard } from '../types'
import type { BoardRole } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createServerClient()
  const { data: board } = await supabase.from('boards').select('name').eq('id', params.id).single()
  return { title: board ? `${board.name} – MyShiftX` : 'Board – MyShiftX' }
}

export default async function BoardPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'Admin'

  // Verify access: must be an approved member or admin
  if (!isAdmin) {
    const { data: membership } = await supabase
      .from('user_boards')
      .select('role')
      .eq('board_id', params.id)
      .eq('user_id', user.id)
      .eq('is_approved', true)
      .single()

    if (!membership) notFound()
  }

  const { data: board } = await supabase
    .from('boards').select('id, name').eq('id', params.id).single()
  if (!board) notFound()

  const { data: memberRows } = await supabase
    .from('user_boards')
    .select('id, user_id, board_id, role, users!user_id(display_name)')
    .eq('board_id', params.id).eq('is_approved', true).order('role', { ascending: true })

  const membersByBoard = groupMembersByBoard(memberRows)

  // Determine viewer's role
  let myRole: BoardRole = 'User'
  if (isAdmin) {
    myRole = 'Leader'
  } else {
    const { data: m } = await supabase
      .from('user_boards').select('role')
      .eq('board_id', params.id).eq('user_id', user.id).eq('is_approved', true).single()
    if (m) myRole = m.role as BoardRole
  }

  const managedBoards: ManagedBoard[] = [{
    boardId:   board.id,
    boardName: board.name,
    myRole,
    members:   membersByBoard.get(board.id) ?? [],
  }]

  return (
    <BoardsClient
      managedBoards={managedBoards}
      currentUserId={user.id}
      isAdmin={isAdmin}
    />
  )
}
