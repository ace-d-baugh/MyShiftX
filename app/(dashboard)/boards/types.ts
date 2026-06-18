import type { BoardRole } from '@/lib/database.types'

export interface BoardMember {
  userBoardId: string
  userId: string
  displayName: string | null
  role: BoardRole
}

export interface ManagedBoard {
  boardId: string
  boardName: string
  myRole: BoardRole
  members: BoardMember[]
}
