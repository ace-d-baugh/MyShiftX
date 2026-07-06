'use server'

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { sendPushNotification } from '@/lib/push-server'
import { boardApprovedHtml, interestedHtml, shiftMatchHtml } from '@/components/email-template'
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'
import type { PreferredTime } from '@/lib/database.types'
import { env, optionalServerEnv } from '@/lib/env'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myshiftx.com'

const resend = new Resend(optionalServerEnv.RESEND_API_KEY ?? '')

// Service-role client — needed to read another user's email address
function adminDb() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Fire-and-forget: email the post owner when someone marks interest.
 * Called from the client after a successful interest insert.
 * Never throws — errors are logged but never reach the user.
 */
export async function notifyInterest(opts: {
  postId: string
  postType: 'shift' | 'request'
  commenterName: string
}): Promise<void> {
  try {
    // Guard: fail fast with a clear message if env vars are missing
    if (!optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[notifyInterest] SUPABASE_SERVICE_ROLE_KEY is not set — cannot send interest notification')
      return
    }

    const db = adminDb()
    let ownerId: string | null = null
    let ownerEmail: string | null = null
    let ownerWantsEmail = false
    let postTitle = ''

    if (opts.postType === 'shift') {
      const { data, error } = await db
        .from('shifts')
        .select('shift_title, user_id, users!user_id(email, notify_via_email)')
        .eq('id', opts.postId)
        .eq('is_active', true)
        .single()

      if (error) { console.error('[notifyInterest] shift query error:', error.message); return }
      if (!data) { console.error('[notifyInterest] shift not found:', opts.postId); return }

      const owner = (data.users as unknown) as { email: string; notify_via_email: boolean } | null
      if (!owner) { console.error('[notifyInterest] no owner found for shift:', opts.postId); return }

      postTitle = data.shift_title as string
      ownerId = data.user_id as string | null
      ownerEmail = owner.email
      ownerWantsEmail = owner.notify_via_email
    } else {
      const { data, error } = await db
        .from('requests')
        .select('requested_date, user_id, users!user_id(email, notify_via_email)')
        .eq('id', opts.postId)
        .eq('is_active', true)
        .single()

      if (error) { console.error('[notifyInterest] request query error:', error.message); return }
      if (!data) { console.error('[notifyInterest] request not found:', opts.postId); return }

      const owner = (data.users as unknown) as { email: string; notify_via_email: boolean } | null
      if (!owner) { console.error('[notifyInterest] no owner found for request:', opts.postId); return }

      postTitle = `Shift Request — ${data.requested_date as string}`
      ownerId = data.user_id as string | null
      ownerEmail = owner.email
      ownerWantsEmail = owner.notify_via_email
    }

    // Push and email are independent channels: push goes to whatever devices
    // the owner has enabled; notify_via_email only gates the email.
    if (ownerId) {
      await sendPushNotification(
        ownerId,
        `${opts.commenterName} is interested`,
        `${opts.commenterName} marked interest in "${postTitle}"`,
        '/wall'
      )
    }

    if (!ownerWantsEmail) return
    if (!ownerEmail) { console.error('[notifyInterest] ownerEmail is null after lookup'); return }
    if (!optionalServerEnv.RESEND_API_KEY) {
      console.error('[notifyInterest] RESEND_API_KEY is not set — cannot send interest email')
      return
    }

    const { error: sendError } = await resend.emails.send({
      from: 'MyShiftX <noreply@myshiftx.com>',
      to: ownerEmail,
      subject: `${opts.commenterName} is interested in your ${opts.postType === 'shift' ? 'shift' : 'request'}`,
      html: interestedHtml({
        commenterName: opts.commenterName,
        postTitle,
        postType: opts.postType,
        wallUrl: `${BASE_URL}/wall`,
      }),
    })

    if (sendError) {
      console.error('[notifyInterest] Resend error:', sendError)
    }
  } catch (err) {
    console.error('[notifyInterest] unexpected error:', err)
  }
}

// Web push lives in lib/push-server.ts (shared with the messaging actions).
// It's imported rather than exported here so it never becomes a
// client-callable action.

// ── Helpers ───────────────────────────────────────────────────────────────────

const ET = 'America/New_York'

function shiftMatchesPreferences(startTimeIso: string, preferences: PreferredTime[]): boolean {
  const hour = parseInt(formatInTimeZone(parseISO(startTimeIso), ET, 'H'))
  return preferences.some(pref => {
    if (pref === 'morning')   return hour >= 6  && hour < 12
    if (pref === 'afternoon') return hour >= 12 && hour < 18
    if (pref === 'evening')   return hour >= 18 && hour < 24
    if (pref === 'late')      return hour >= 0  && hour < 6
    return false
  })
}

function getETDate(isoString: string): string {
  return formatInTimeZone(parseISO(isoString), ET, 'yyyy-MM-dd')
}

function formatDisplayDate(isoDate: string): string {
  // isoDate is yyyy-MM-dd — display as e.g. "Saturday, June 28"
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

async function sendMatchNotifications(opts: {
  shiftTitle: string
  requestTitle: string
  boardName: string
  shiftDate: string
  shiftPosterUserId: string | null
  shiftPosterEmail: string | null
  shiftPosterName: string
  shiftPosterNotify: boolean
  requesterUserId: string | null
  requesterEmail: string | null
  requesterName: string
  requesterNotify: boolean
}) {
  const wallUrl = `${BASE_URL}/wall`
  const displayDate = formatDisplayDate(opts.shiftDate)
  const sends: Promise<void>[] = []

  // Web push to both parties — independent of the notify_via_email pref
  if (opts.requesterUserId) {
    sends.push(sendPushNotification(
      opts.requesterUserId,
      'Possible shift match',
      `${opts.shiftPosterName}'s shift "${opts.shiftTitle}" on ${displayDate} may match your request`,
      '/wall'
    ))
  }
  if (opts.shiftPosterUserId) {
    sends.push(sendPushNotification(
      opts.shiftPosterUserId,
      'Possible shift match',
      `${opts.requesterName} is looking for a shift on ${displayDate} — yours may match`,
      '/wall'
    ))
  }

  if (opts.requesterNotify && opts.requesterEmail) {
    sends.push(resend.emails.send({
      from: 'MyShiftX <noreply@myshiftx.com>',
      to: opts.requesterEmail,
      subject: `A shift may match your request on ${displayDate}`,
      html: shiftMatchHtml({
        recipientRole: 'requester',
        otherPartyName: opts.shiftPosterName,
        ownPostTitle: opts.requestTitle,
        otherPostTitle: opts.shiftTitle,
        boardName: opts.boardName,
        shiftDate: displayDate,
        wallUrl,
      }),
    }).then(({ error }) => {
      if (error) console.error('[notifyMatch] Resend error (requester):', error)
    }))
  }

  if (opts.shiftPosterNotify && opts.shiftPosterEmail) {
    sends.push(resend.emails.send({
      from: 'MyShiftX <noreply@myshiftx.com>',
      to: opts.shiftPosterEmail,
      subject: `Your shift may match a request on ${displayDate}`,
      html: shiftMatchHtml({
        recipientRole: 'shift-poster',
        otherPartyName: opts.requesterName,
        ownPostTitle: opts.shiftTitle,
        otherPostTitle: opts.requestTitle,
        boardName: opts.boardName,
        shiftDate: displayDate,
        wallUrl,
      }),
    }).then(({ error }) => {
      if (error) console.error('[notifyMatch] Resend error (shift poster):', error)
    }))
  }

  await Promise.all(sends)
}

// ── Match notifications ────────────────────────────────────────────────────────

/**
 * Called after a new shift is posted.
 * Finds any active requests on the same board for the same date whose
 * preferred_times overlap the shift's start time, then emails both parties.
 */
export async function notifyShiftPosted(opts: {
  boardId: string
  startTimeIso: string
  shiftTitle: string
  posterName: string
  posterUserId: string
}): Promise<void> {
  try {
    if (!optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[notifyShiftPosted] SUPABASE_SERVICE_ROLE_KEY is not set — skipping')
      return
    }

    const db = adminDb()
    const shiftDate = getETDate(opts.startTimeIso)

    // Fetch poster's own email + notify pref
    const { data: posterData } = await db
      .from('users')
      .select('email, notify_via_email')
      .eq('id', opts.posterUserId)
      .single()

    // Fetch active requests on the same board for the same date
    const { data: requests, error } = await db
      .from('requests')
      .select('request_title, preferred_times, user_id, users!user_id(email, display_name, notify_via_email), boards!board_id(name)')
      .eq('board_id', opts.boardId)
      .eq('requested_date', shiftDate)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .neq('user_id', opts.posterUserId) // don't match your own posts

    if (error) { console.error('[notifyShiftPosted] query error:', error.message); return }

    // Deduplicate by requester user_id — same person may have multiple matching requests
    const seenRequesters = new Set<string>()
    for (const req of (requests ?? [])) {
      const uid = req.user_id as string | null
      if (!uid || seenRequesters.has(uid)) continue

      const prefs = req.preferred_times as PreferredTime[]
      if (!shiftMatchesPreferences(opts.startTimeIso, prefs)) continue

      seenRequesters.add(uid)
      const requester = (req.users as unknown) as { email: string; display_name: string | null; notify_via_email: boolean } | null
      const board     = (req.boards as unknown) as { name: string } | null

      await sendMatchNotifications({
        shiftTitle:        opts.shiftTitle,
        requestTitle:      req.request_title as string,
        boardName:         board?.name ?? 'your board',
        shiftDate,
        shiftPosterUserId: opts.posterUserId,
        shiftPosterEmail:  posterData?.email ?? null,
        shiftPosterName:   opts.posterName,
        shiftPosterNotify: posterData?.notify_via_email ?? false,
        requesterUserId:   uid,
        requesterEmail:    requester?.email ?? null,
        requesterName:     requester?.display_name ?? 'Someone',
        requesterNotify:   requester?.notify_via_email ?? false,
      })
    }
  } catch (err) {
    console.error('[notifyShiftPosted] unexpected error:', err)
  }
}

/**
 * Called after a new request is posted.
 * Finds any active shifts on the same board for the same date whose
 * start time falls within the request's preferred_times, then emails both parties.
 */
export async function notifyRequestPosted(opts: {
  boardId: string
  requestedDate: string
  preferredTimes: PreferredTime[]
  requestTitle: string
  requesterName: string
  requesterUserId: string
}): Promise<void> {
  try {
    if (!optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[notifyRequestPosted] SUPABASE_SERVICE_ROLE_KEY is not set — skipping')
      return
    }

    const db = adminDb()

    // Fetch requester's own email + notify pref
    const { data: requesterData } = await db
      .from('users')
      .select('email, notify_via_email')
      .eq('id', opts.requesterUserId)
      .single()

    // Fetch all active shifts on the same board — filter by ET date + time preference in JS
    // (No UTC date range filter: timezone conversion makes UTC ranges fragile;
    //  getETDate() does the correct ET date comparison instead.)
    const { data: shifts, error } = await db
      .from('shifts')
      .select('shift_title, start_time, user_id, users!user_id(email, display_name, notify_via_email), boards!board_id(name)')
      .eq('board_id', opts.boardId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .neq('user_id', opts.requesterUserId)

    if (error) { console.error('[notifyRequestPosted] query error:', error.message); return }

    // Deduplicate by shift poster user_id — same person may have multiple matching shifts
    const seenPosters = new Set<string>()
    for (const shift of (shifts ?? [])) {
      const uid = shift.user_id as string | null
      if (!uid || seenPosters.has(uid)) continue

      const startIso = shift.start_time as string
      if (getETDate(startIso) !== opts.requestedDate) continue
      if (!shiftMatchesPreferences(startIso, opts.preferredTimes)) continue

      seenPosters.add(uid)
      const poster = (shift.users as unknown) as { email: string; display_name: string | null; notify_via_email: boolean } | null
      const board  = (shift.boards as unknown) as { name: string } | null

      await sendMatchNotifications({
        shiftTitle:        shift.shift_title as string,
        requestTitle:      opts.requestTitle,
        boardName:         board?.name ?? 'your board',
        shiftDate:         opts.requestedDate,
        shiftPosterUserId: uid,
        shiftPosterEmail:  poster?.email ?? null,
        shiftPosterName:   poster?.display_name ?? 'Someone',
        shiftPosterNotify: poster?.notify_via_email ?? false,
        requesterUserId:   opts.requesterUserId,
        requesterEmail:    requesterData?.email ?? null,
        requesterName:     opts.requesterName,
        requesterNotify:   requesterData?.notify_via_email ?? false,
      })
    }
  } catch (err) {
    console.error('[notifyRequestPosted] unexpected error:', err)
  }
}

/**
 * Fire-and-forget: email the user when their board join request is approved.
 * Uses service-role client to read the approving user's email without RLS restrictions.
 * Sent unconditionally — this is a transactional response to the user's own action.
 */
export async function notifyBoardApproved(userBoardId: string): Promise<void> {
  try {
    if (!optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[notifyBoardApproved] SUPABASE_SERVICE_ROLE_KEY is not set — skipping')
      return
    }

    const db = adminDb()

    const { data: ub } = await db
      .from('user_boards')
      .select('user_id, boards(name), users!user_id(email, display_name)')
      .eq('id', userBoardId)
      .single()

    if (!ub) return
    const boardName = (ub.boards as unknown as { name: string } | null)?.name
    if (!boardName) return

    const user = (ub.users as unknown) as { email: string; display_name: string | null } | null
    if (!user?.email) return

    const memberUserId = ub.user_id as string | null
    if (memberUserId) {
      await sendPushNotification(
        memberUserId,
        `You've been accepted to ${boardName}!`,
        'Your join request was approved. Head to the Wall to see posts.',
        '/wall'
      )
    }

    if (!optionalServerEnv.RESEND_API_KEY) {
      console.error('[notifyBoardApproved] RESEND_API_KEY is not set — skipping email')
      return
    }

    await resend.emails.send({
      from: 'noreply@myshiftx.com',
      to: user.email,
      subject: `You've been accepted to ${boardName}!`,
      html: boardApprovedHtml({
        displayName: user.display_name ?? undefined,
        boardName,
        wallUrl: `${BASE_URL}/wall`,
      }),
    })
  } catch (err) {
    console.error('[notifyBoardApproved] failed:', err)
  }
}
