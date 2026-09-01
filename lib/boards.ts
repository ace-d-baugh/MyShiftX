import type { createClient } from '@/lib/supabase/client'

type Supabase = ReturnType<typeof createClient>

/**
 * Invite codes are stored and transmitted (URLs, clipboard, QR) as a plain
 * alphanumeric string — the "XXXXX-XXXXX" grouping is a display-only
 * aesthetic, never the value that gets copied, linked, or looked up.
 */
export function formatInviteCodeDisplay(code: string): string {
  return code.length > 5 ? `${code.slice(0, 5)}-${code.slice(5)}` : code
}

/** Strips the display dash (or any other stray punctuation from a paste). */
export function normalizeInviteCodeInput(raw: string, maxLength = 10): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, maxLength)
}

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
