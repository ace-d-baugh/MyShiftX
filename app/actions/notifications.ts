'use server'

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { interestedHtml } from '@/components/email-template'

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
