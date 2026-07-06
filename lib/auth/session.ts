import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { GlobalRole } from '@/lib/database.types'

type Supabase = ReturnType<typeof createServerClient>

/** Require a logged-in session; redirects to /login otherwise. For use in pages/layouts. */
export async function requireUser() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

/**
 * For use in server actions: returns the session or throws. Callers should
 * wrap in try/catch and surface `{ error: e.message }` rather than redirect,
 * since actions run in response to a UI interaction, not a page load.
 */
export async function getActionSession() {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, userId: user.id }
}

export async function getUserRole(supabase: Supabase, userId: string): Promise<GlobalRole | null> {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single()
  return (data?.role as GlobalRole | undefined) ?? null
}

/** For use in server actions: requires the session user to be a global Admin, or throws. */
export async function requireAdminAction() {
  const { supabase, userId } = await getActionSession()
  const role = await getUserRole(supabase, userId)
  if (role !== 'Admin') throw new Error('Not authorized.')
  return { supabase, userId }
}

/** Require the session user to be a global Admin; redirects to /wall otherwise. */
export async function requireAdmin() {
  const { supabase, user } = await requireUser()
  const role = await getUserRole(supabase, user.id)
  if (role !== 'Admin') redirect('/wall')
  return { supabase, user }
}

/** Require the session user to be a global Admin or a Mod/Leader of at least one board; redirects to /wall otherwise. */
export async function requireModeratorOrAdmin() {
  const { supabase, user } = await requireUser()
  const [role, { data: isModRpc }] = await Promise.all([
    getUserRole(supabase, user.id),
    supabase.rpc('is_any_board_moderator'),
  ])
  const isAdmin = role === 'Admin'
  const isMod = Boolean(isModRpc)
  if (!isAdmin && !isMod) redirect('/wall')
  return { supabase, user, isAdmin, isMod }
}

/**
 * Whether ads should be shown to the current session user (Basic/Free tier
 * only — Pro and Trial members never see ads). Uses get_own_membership()
 * since membership/trial columns are column-locked from direct SELECT.
 * Defaults to false (no ads) if the lookup fails, so an error never
 * accidentally shows ads to a paying member.
 */
export async function getShowAds(supabase: Supabase): Promise<boolean> {
  const { data } = await supabase.rpc('get_own_membership').single()
  return data?.membership === 'Basic'
}

/**
 * Same as getShowAds, but for public pages (Terms, Privacy, Data Deletion)
 * that anonymous visitors can reach without an account. There's no paying
 * membership to protect for a signed-out visitor, so they always see ads;
 * a logged-in visitor falls back to the normal Basic-only rule.
 */
export async function getPublicShowAds(supabase: Supabase): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return true
  return getShowAds(supabase)
}
