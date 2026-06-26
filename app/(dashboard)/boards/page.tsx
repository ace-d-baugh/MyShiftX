import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { BoardsClient } from './BoardsClient'
import { groupMembersByBoard } from './utils'
import type { ManagedBoard } from './types'
import type { BoardRole } from '@/lib/database.types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Boards – MyShiftX' }

export default async function BoardsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'Admin'

  let managedBoards: ManagedBoard[] = []

  if (isAdmin) {
    const { data: allBoards } = await supabase
      .from('boards').select('id, name').eq('is_active', true).order('name')

    const boardIds = (allBoards ?? []).map(b => b.id)
    const { data: memberRows } = boardIds.length
      ? await supabase
          .from('user_boards')
          .select('id, user_id, board_id, role, users!user_id(display_name)')
          .in('board_id', boardIds).eq('is_approved', true).eq('is_hidden', false).order('role', { ascending: true })
      : { data: [] }

    const membersByBoard = groupMembersByBoard(memberRows)
    managedBoards = (allBoards ?? []).map(b => ({
      boardId: b.id, boardName: b.name,
      myRole: 'Leader' as BoardRole,
      members: membersByBoard.get(b.id) ?? [],
    }))
  } else {
    // All approved memberships regardless of role
    const { data: myBoards } = await supabase
      .from('user_boards')
      .select('id, board_id, role, boards(id, name)')
      .eq('user_id', user.id).eq('is_approved', true)
      .order('requested_at', { ascending: true })

    const boardIds = (myBoards ?? []).map(b => b.board_id)
    const { data: memberRows } = boardIds.length
      ? await supabase
          .from('user_boards')
          .select('id, user_id, board_id, role, users!user_id(display_name)')
          .in('board_id', boardIds).eq('is_approved', true).eq('is_hidden', false).order('role', { ascending: true })
      : { data: [] }

    const membersByBoard = groupMembersByBoard(memberRows)
    managedBoards = (myBoards ?? []).map((b: Record<string, unknown>) => ({
      boardId:   b.board_id as string,
      boardName: (b.boards as { name: string } | null)?.name ?? '',
      myRole:    b.role as BoardRole,
      members:   membersByBoard.get(b.board_id as string) ?? [],
    }))
  }

  return (
    <BoardsClient
      managedBoards={managedBoards}
      currentUserId={user.id}
      isAdmin={isAdmin}
    />
  )
}
