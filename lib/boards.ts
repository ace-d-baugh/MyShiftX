import type { createClient } from '@/lib/supabase/client'

type Supabase = ReturnType<typeof createClient>

export interface MyBoard {
  id: string
  name: string
  /** Join request still awaiting a board admin's approval. */
  pending?: boolean
}

/**
 * The user's board memberships — approved AND pending — approved first, then
 * A→Z. Pending boards are usable for calendar-only features (Task 22 v3);
 * callers gate wall posting on `pending` themselves. Shared by the schedule
 * import modal and the post-shift form (was duplicated in both).
 */
export async function fetchMyBoards(supabase: Supabase, userId: string): Promise<MyBoard[]> {
  const { data } = await supabase
    .from('user_boards')
    .select('board_id, is_approved, boards(id, name)')
    .eq('user_id', userId)

  return (data ?? [])
    .map((ub): MyBoard | null => {
      const b = ub.boards as { id: string; name: string } | null
      return b ? { ...b, pending: !ub.is_approved } : null
    })
    .filter((b): b is MyBoard => !!b)
    .sort((a, b) =>
      Number(a.pending ?? false) - Number(b.pending ?? false) || a.name.localeCompare(b.name))
}
