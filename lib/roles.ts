import type { GlobalRole, BoardRole } from '@/lib/database.types'

// Site vernacular (2026-07-18): the board role stored as 'Leader' displays as
// "Admin", and the global role stored as 'Admin' displays as "Overlord".
// Internal identifiers — DB values, RLS policies, route paths (/leader,
// /admin), and code comparisons — are unchanged; only what users read moved.
// If the vernacular shifts again, this file is the only place labels live.

export const BOARD_ROLE_LABEL: Record<BoardRole, string> = {
  User: 'User',
  Mod: 'Mod',
  Leader: 'Admin',
}

export const GLOBAL_ROLE_LABEL: Record<GlobalRole, string> = {
  Guest: 'Guest',
  User: 'User',
  Admin: 'Overlord',
}
