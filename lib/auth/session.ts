import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { assertWritesEnabled } from '@/lib/showcase/guard'
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
 *
 * Also the chokepoint for showcase mode's write kill-switch: every
 * authenticated server action funnels through here, so one check disables
 * them all. See lib/showcase/guard.ts.
 */
export async function getActionSession() {
  assertWritesEnabled()
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

export interface Membership {
  tier: 'Basic' | 'Pro' | 'Trial'
  trialEndsAt: string | null
  trialUsed: boolean
  billingCycle: string | null
}

/**
 * The current user's membership, via the get_own_membership() RPC (the
 * membership columns are column-locked from direct SELECT). Falls back to
 * Basic on any failure, so feature gating errs toward the free experience;
 * ads specifically use getShowAds below, which errs the other way.
 */
export async function getMembership(supabase: Supabase): Promise<Membership> {
  const { data } = await supabase.rpc('get_own_membership').single()
  const tier = data?.membership
  return {
    tier: tier === 'Pro' || tier === 'Trial' ? tier : 'Basic',
    trialEndsAt: data?.trial_ends_at ?? null,
    trialUsed: Boolean(data?.trial_used),
    billingCycle: data?.billing_cycle ?? null,
  }
}

/** Pro and Trial members get every gated feature. */
export function isProTier(m: Membership): boolean {
  return m.tier === 'Pro' || m.tier === 'Trial'
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

export interface LandingHeaderData {
  displayName: string | null
  userRole: GlobalRole
  isBoardModerator: boolean
  isLeader: boolean
  pendingApprovalsCount: number
  pendingFlagsCount: number
  unreadMessagesCount: number
  unreadNotificationsCount: number
  showUpgrade: boolean
}

/**
 * Full <LandingHeader> props for the current session, on any public page
 * that visitor can reach signed in or out — display name, notification
 * badges, mod/admin dropdown items, and the Upgrade prompt for Basic-tier
 * users. Without this, a public page passing `displayName={null}` unconditionally
 * shows the signed-out Log In / Get Started header even to a logged-in user.
 * Signed-out visitors get the all-false/null defaults with no extra queries.
 */
export async function getLandingHeaderData(supabase: Supabase): Promise<LandingHeaderData> {
  const { data: { user } } = await supabase.auth.getUser()

  const data: LandingHeaderData = {
    displayName: null,
    userRole: 'Guest',
    isBoardModerator: false,
    isLeader: false,
    pendingApprovalsCount: 0,
    pendingFlagsCount: 0,
    unreadMessagesCount: 0,
    unreadNotificationsCount: 0,
    showUpgrade: false,
  }
  if (!user) return data

  const [{ data: profile }, { data: isModRpc }, { data: unreadMessages }, { data: unreadNotifications }, showAds] = await Promise.all([
    supabase.from('users').select('display_name, role').eq('id', user.id).single(),
    supabase.rpc('is_any_board_moderator'),
    supabase.rpc('get_unread_message_count'),
    supabase.rpc('get_unread_notification_count'),
    getShowAds(supabase),
  ])
  data.displayName = profile?.display_name ?? user.email ?? 'Account'
  data.userRole = (profile?.role as GlobalRole | undefined) ?? 'User'
  data.unreadMessagesCount = unreadMessages ?? 0
  data.unreadNotificationsCount = unreadNotifications ?? 0
  data.showUpgrade = showAds

  const isAdmin = data.userRole === 'Admin'
  data.isBoardModerator = Boolean(isModRpc)
  data.isLeader = isAdmin

  if (data.isBoardModerator || isAdmin) {
    const [approvalsRes, flagsRes, leaderRes] = await Promise.all([
      supabase.from('user_boards').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('flags').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      isAdmin
        ? Promise.resolve({ count: 1 })
        : supabase.from('user_boards').select('id', { count: 'exact', head: true })
            .eq('user_id', user.id).eq('role', 'Leader').eq('is_approved', true),
    ])
    data.pendingApprovalsCount = approvalsRes.count ?? 0
    data.pendingFlagsCount = flagsRes.count ?? 0
    if (!isAdmin) data.isLeader = (leaderRes.count ?? 0) > 0
  }

  return data
}
