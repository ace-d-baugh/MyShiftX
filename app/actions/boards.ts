'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O/0, I/1 ambiguity
  let code = ''
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function getSession() {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, userId: user.id }
}

// ── Create a board ────────────────────────────────────────────────────────────

export async function createBoard(name: string): Promise<{ error?: string; boardId?: string }> {
  try {
    const { supabase, userId } = await getSession()

    // Verify global role is User or Admin
    const { data: profile } = await supabase.from('users').select('role, display_name').eq('id', userId).single()
    if (!profile || !['User', 'Admin'].includes(profile.role)) {
      return { error: 'Only verified users can create boards.' }
    }
    if (!profile.display_name || profile.display_name === 'User') {
      return { error: 'Please set your display name before creating a board.' }
    }

    // Generate a unique invite code (retry on collision)
    let invite_code = ''
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateInviteCode()
      const { data: existing } = await supabase.from('boards').select('id').eq('invite_code', candidate).single()
      if (!existing) { invite_code = candidate; break }
    }
    if (!invite_code) return { error: 'Failed to generate a unique invite code. Please try again.' }

    const { data: board, error: boardErr } = await supabase
      .from('boards')
      .insert({ name: name.trim(), invite_code, created_by: userId })
      .select('id')
      .single()

    if (boardErr) {
      if (boardErr.code === '23505') return { error: 'A board with that name already exists.' }
      return { error: boardErr.message }
    }

    // Auto-assign creator as Leader
    const { error: memberErr } = await supabase.from('user_boards').insert({
      user_id: userId,
      board_id: board.id,
      role: 'Leader',
      is_approved: true,
      approved_by_user_id: userId,
      approved_at: new Date().toISOString(),
    })

    if (memberErr) return { error: memberErr.message }

    revalidatePath('/profile')
    return { boardId: board.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── Join a board (rate-limited) ───────────────────────────────────────────────

const RATE_LIMIT_WINDOW_SECONDS = 60
const RATE_LIMIT_MAX_PER_WINDOW = 5
const DEACTIVATE_THRESHOLD = 15

export async function lookupBoardByCode(code: string): Promise<{
  error?: string
  rateLimited?: boolean
  board?: { id: string; name: string }
}> {
  try {
    const { supabase, userId } = await getSession()
    const upperCode = code.toUpperCase()

    // Count failures in the last minute
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString()
    const { count: recentFailures } = await supabase
      .from('board_join_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('outcome', 'success')
      .gte('attempted_at', windowStart)

    if ((recentFailures ?? 0) >= RATE_LIMIT_MAX_PER_WINDOW) {
      return { rateLimited: true, error: 'Too many attempts. Please wait a minute before trying again.' }
    }

    // Look up the board
    const { data: board } = await supabase
      .from('boards')
      .select('id, name, invite_code_enabled, is_active')
      .eq('invite_code', upperCode)
      .single()

    if (!board || !board.is_active) {
      await recordAttempt(supabase, userId, upperCode, 'invalid_code')
      await checkDeactivationThreshold(supabase, userId)
      return { error: 'Invalid invite code.' }
    }

    if (!board.invite_code_enabled) {
      await recordAttempt(supabase, userId, upperCode, 'invalid_code')
      await checkDeactivationThreshold(supabase, userId)
      return { error: 'This board is not accepting new members right now.' }
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('user_boards')
      .select('id, is_approved')
      .eq('user_id', userId)
      .eq('board_id', board.id)
      .single()

    if (existing) {
      return { error: existing.is_approved ? 'You are already a member of this board.' : 'Your request to join this board is pending approval.' }
    }

    return { board: { id: board.id, name: board.name } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function confirmJoinBoard(boardId: string, confirmed: boolean): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await getSession()

    // Get the board's invite code for logging
    const { data: board } = await supabase.from('boards').select('invite_code').eq('id', boardId).single()
    const code = board?.invite_code ?? ''

    if (!confirmed) {
      await recordAttempt(supabase, userId, code, 'user_declined')
      await checkDeactivationThreshold(supabase, userId)
      return {}
    }

    const { error } = await supabase.from('user_boards').insert({
      user_id: userId,
      board_id: boardId,
      role: 'User',
      is_approved: false,
    })

    if (error) return { error: error.message }

    await recordAttempt(supabase, userId, code, 'success')
    revalidatePath('/profile')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

async function recordAttempt(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  code: string,
  outcome: 'invalid_code' | 'user_declined' | 'success'
) {
  await supabase.from('board_join_attempts').insert({ user_id: userId, code_entered: code, outcome })
}

async function checkDeactivationThreshold(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const dayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('board_join_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('outcome', 'success')
    .gte('attempted_at', dayStart)

  if ((count ?? 0) >= DEACTIVATE_THRESHOLD) {
    await supabase.from('users').update({ is_active: false }).eq('id', userId)
  }
}

// ── Leave a board ─────────────────────────────────────────────────────────────

export async function leaveBoard(boardId: string): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await getSession()

    // Prevent leaving if you're the only Leader
    const { data: membership } = await supabase
      .from('user_boards')
      .select('role')
      .eq('user_id', userId)
      .eq('board_id', boardId)
      .single()

    if (membership?.role === 'Leader') {
      const { count } = await supabase
        .from('user_boards')
        .select('id', { count: 'exact', head: true })
        .eq('board_id', boardId)
        .eq('role', 'Leader')
        .eq('is_approved', true)

      if ((count ?? 0) <= 1) {
        return { error: 'You are the only Leader of this board. Delete the board or promote another member first.' }
      }
    }

    const { error } = await supabase
      .from('user_boards')
      .delete()
      .eq('user_id', userId)
      .eq('board_id', boardId)

    if (error) return { error: error.message }
    revalidatePath('/profile')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── Delete a board (Leader only) ──────────────────────────────────────────────

export async function deleteBoard(boardId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await getSession()
    // RLS enforces leader-only; CASCADE handles user_boards, shifts, requests
    const { error } = await supabase.from('boards').delete().eq('id', boardId)
    if (error) return { error: error.message }
    revalidatePath('/profile')
    revalidatePath('/wall')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── Rename a board (Leader only) ──────────────────────────────────────────────

export async function updateBoardName(boardId: string, name: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await getSession()
    const { error } = await supabase.from('boards').update({ name: name.trim() }).eq('id', boardId)
    if (error) {
      if (error.code === '23505') return { error: 'A board with that name already exists.' }
      return { error: error.message }
    }
    revalidatePath('/profile')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── Toggle invite code enabled (Leader only) ──────────────────────────────────

export async function toggleInviteCode(boardId: string, enabled: boolean): Promise<{ error?: string }> {
  try {
    const { supabase } = await getSession()
    const { error } = await supabase.from('boards').update({ invite_code_enabled: enabled }).eq('id', boardId)
    if (error) return { error: error.message }
    revalidatePath('/profile')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── Regenerate invite code (Leader only) ─────────────────────────────────────

export async function regenerateInviteCode(boardId: string): Promise<{ error?: string; code?: string }> {
  try {
    const { supabase } = await getSession()

    let invite_code = ''
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateInviteCode()
      const { data: existing } = await supabase.from('boards').select('id').eq('invite_code', candidate).single()
      if (!existing) { invite_code = candidate; break }
    }
    if (!invite_code) return { error: 'Failed to generate a unique code. Please try again.' }

    const { error } = await supabase.from('boards').update({ invite_code }).eq('id', boardId)
    if (error) return { error: error.message }
    revalidatePath('/profile')
    return { code: invite_code }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── Approve / reject a join request (Mod / Leader) ───────────────────────────

export async function approveUserBoard(userBoardId: string, approverId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await getSession()
    const { error } = await supabase
      .from('user_boards')
      .update({ is_approved: true, approved_by_user_id: approverId, approved_at: new Date().toISOString() })
      .eq('id', userBoardId)
    if (error) return { error: error.message }
    revalidatePath('/leader/approvals')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function rejectUserBoard(userBoardId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await getSession()
    const { error } = await supabase.from('user_boards').delete().eq('id', userBoardId)
    if (error) return { error: error.message }
    revalidatePath('/leader/approvals')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── Change a member's board role (Leader only) ────────────────────────────────

export async function updateUserBoardRole(
  userBoardId: string,
  newRole: 'User' | 'Mod'
): Promise<{ error?: string }> {
  try {
    const { supabase } = await getSession()
    const { error } = await supabase.from('user_boards').update({ role: newRole }).eq('id', userBoardId)
    if (error) return { error: error.message }
    revalidatePath('/leader/approvals')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── Remove a member from a board (Mod / Leader) ───────────────────────────────

export async function removeUserFromBoard(userBoardId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await getSession()
    const { error } = await supabase.from('user_boards').delete().eq('id', userBoardId)
    if (error) return { error: error.message }
    revalidatePath('/leader/approvals')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
