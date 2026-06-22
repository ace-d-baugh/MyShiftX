'use server'

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { interestedHtml, shiftMatchHtml } from '@/components/email-template'
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'
import type { PreferredTime } from '@/lib/database.types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myshiftx.com'

const resend = new Resend(process.env.RESEND_API_KEY!)

// Service-role client — needed to read another user's email address
function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[notifyInterest] SUPABASE_SERVICE_ROLE_KEY is not set — cannot send interest notification')
      return
    }
    if (!process.env.RESEND_API_KEY) {
      console.error('[notifyInterest] RESEND_API_KEY is not set — cannot send interest notification')
      return
    }

    const db = adminDb()
    let ownerEmail: string | null = null
    let postTitle = ''

    if (opts.postType === 'shift') {
      const { data, error } = await db
        .from('shifts')
        .select('shift_title, users!user_id(email, notify_via_email)')
        .eq('id', opts.postId)
        .eq('is_active', true)
        .single()

      if (error) { console.error('[notifyInterest] shift query error:', error.message); return }
      if (!data) { console.error('[notifyInterest] shift not found:', opts.postId); return }

      const owner = (data.users as unknown) as { email: string; notify_via_email: boolean } | null
      if (!owner) { console.error('[notifyInterest] no owner found for shift:', opts.postId); return }
      if (!owner.notify_via_email) { console.log('[notifyInterest] owner has email notifications off — skipping'); return }

      postTitle = data.shift_title as string
      ownerEmail = owner.email
    } else {
      const { data, error } = await db
        .from('requests')
        .select('requested_date, users!user_id(email, notify_via_email)')
        .eq('id', opts.postId)
        .eq('is_active', true)
        .single()

      if (error) { console.error('[notifyInterest] request query error:', error.message); return }
      if (!data) { console.error('[notifyInterest] request not found:', opts.postId); return }

      const owner = (data.users as unknown) as { email: string; notify_via_email: boolean } | null
      if (!owner) { console.error('[notifyInterest] no owner found for request:', opts.postId); return }
      if (!owner.notify_via_email) { console.log('[notifyInterest] owner has email notifications off — skipping'); return }

      postTitle = `Shift Request — ${data.requested_date as string}`
      ownerEmail = owner.email
    }

    if (!ownerEmail) { console.error('[notifyInterest] ownerEmail is null after lookup'); return }

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
    } else {
      console.log(`[notifyInterest] sent to ${ownerEmail} for ${opts.postType} "${postTitle}"`)
    }
  } catch (err) {
    console.error('[notifyInterest] unexpected error:', err)
  }
}

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

async function sendMatchEmails(opts: {
  shiftTitle: string
  requestTitle: string
  boardName: string
  shiftDate: string
  shiftPosterEmail: string | null
  shiftPosterName: string
  shiftPosterNotify: boolean
  requesterEmail: string | null
  requesterName: string
  requesterNotify: boolean
}) {
  const wallUrl = `${BASE_URL}/wall`
  const displayDate = formatDisplayDate(opts.shiftDate)

  if (opts.requesterNotify && opts.requesterEmail) {
    const { error } = await resend.emails.send({
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
    })
    if (error) console.error('[notifyMatch] Resend error (requester):', error)
    else console.log(`[notifyMatch] sent match email to requester ${opts.requesterEmail}`)
  }

  if (opts.shiftPosterNotify && opts.shiftPosterEmail) {
    const { error } = await resend.emails.send({
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
    })
    if (error) console.error('[notifyMatch] Resend error (shift poster):', error)
    else console.log(`[notifyMatch] sent match email to shift poster ${opts.shiftPosterEmail}`)
  }
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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY) return

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
      .neq('user_id', opts.posterUserId) // don't match your own posts

    if (error) { console.error('[notifyShiftPosted] query error:', error.message); return }

    for (const req of (requests ?? [])) {
      const prefs = req.preferred_times as PreferredTime[]
      if (!shiftMatchesPreferences(opts.startTimeIso, prefs)) continue

      const requester = (req.users as unknown) as { email: string; display_name: string | null; notify_via_email: boolean } | null
      const board     = (req.boards as unknown) as { name: string } | null

      await sendMatchEmails({
        shiftTitle:        opts.shiftTitle,
        requestTitle:      req.request_title as string,
        boardName:         board?.name ?? 'your board',
        shiftDate,
        shiftPosterEmail:  posterData?.email ?? null,
        shiftPosterName:   opts.posterName,
        shiftPosterNotify: posterData?.notify_via_email ?? false,
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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY) return

    const db = adminDb()

    // Fetch requester's own email + notify pref
    const { data: requesterData } = await db
      .from('users')
      .select('email, notify_via_email')
      .eq('id', opts.requesterUserId)
      .single()

    // Fetch active shifts on the same board for the same date
    const { data: shifts, error } = await db
      .from('shifts')
      .select('shift_title, start_time, user_id, users!user_id(email, display_name, notify_via_email), boards!board_id(name)')
      .eq('board_id', opts.boardId)
      .eq('is_active', true)
      .gte('start_time', `${opts.requestedDate}T00:00:00.000Z`)
      .lt('start_time',  `${opts.requestedDate}T23:59:59.999Z`)
      .neq('user_id', opts.requesterUserId)

    if (error) { console.error('[notifyRequestPosted] query error:', error.message); return }

    // The date range above is UTC — filter to ET date + time preference in JS
    for (const shift of (shifts ?? [])) {
      const startIso = shift.start_time as string
      if (getETDate(startIso) !== opts.requestedDate) continue
      if (!shiftMatchesPreferences(startIso, opts.preferredTimes)) continue

      const poster = (shift.users as unknown) as { email: string; display_name: string | null; notify_via_email: boolean } | null
      const board  = (shift.boards as unknown) as { name: string } | null

      await sendMatchEmails({
        shiftTitle:        shift.shift_title as string,
        requestTitle:      opts.requestTitle,
        boardName:         board?.name ?? 'your board',
        shiftDate:         opts.requestedDate,
        shiftPosterEmail:  poster?.email ?? null,
        shiftPosterName:   poster?.display_name ?? 'Someone',
        shiftPosterNotify: poster?.notify_via_email ?? false,
        requesterEmail:    requesterData?.email ?? null,
        requesterName:     opts.requesterName,
        requesterNotify:   requesterData?.notify_via_email ?? false,
      })
    }
  } catch (err) {
    console.error('[notifyRequestPosted] unexpected error:', err)
  }
}
