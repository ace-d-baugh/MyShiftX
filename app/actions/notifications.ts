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
 * Never throws — errors are swallowed so they never reach the user.
 */
export async function notifyInterest(opts: {
  postId: string
  postType: 'shift' | 'request'
  commenterName: string
}): Promise<void> {
  try {
    const db = adminDb()
    let ownerEmail: string | null = null
    let postTitle = ''

    if (opts.postType === 'shift') {
      const { data } = await db
        .from('shifts')
        .select('shift_title, users!user_id(email, notify_via_email)')
        .eq('id', opts.postId)
        .eq('is_active', true)
        .single()

      if (!data) return
      const owner = data.users as { email: string; notify_via_email: boolean } | null
      if (!owner?.notify_via_email) return
      postTitle = data.shift_title as string
      ownerEmail = owner.email
    } else {
      const { data } = await db
        .from('requests')
        .select('requested_date, users!user_id(email, notify_via_email)')
        .eq('id', opts.postId)
        .eq('is_active', true)
        .single()

      if (!data) return
      const owner = data.users as { email: string; notify_via_email: boolean } | null
      if (!owner?.notify_via_email) return
      postTitle = `Shift Request — ${data.requested_date as string}`
      ownerEmail = owner.email
    }

    if (!ownerEmail) return

    await resend.emails.send({
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
  } catch {
    // Intentionally swallowed — notification failure must never affect the user
  }
}
