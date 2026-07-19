'use server'

import { Resend } from 'resend'
import { optionalServerEnv } from '@/lib/env'
import { EMAIL_FROM, SUPPORT_EMAIL } from '@/lib/email-constants'

const resend = new Resend(optionalServerEnv.RESEND_API_KEY ?? '')

export async function sendSupportMessage(opts: {
  fromEmail: string
  subject: string
  message: string
}): Promise<{ error?: string }> {
  const { fromEmail, subject, message } = opts

  if (!optionalServerEnv.RESEND_API_KEY) {
    console.error('[sendSupportMessage] RESEND_API_KEY is not set — cannot send support message')
    return { error: 'Email service is not configured. Please try again later.' }
  }

  if (!subject.trim() || !message.trim()) {
    return { error: 'Subject and message are required.' }
  }

  // Strip newlines/carriage-returns from subject to prevent email header injection
  const safeSubject = subject.trim().replace(/[\r\n]+/g, ' ').slice(0, 200)

  // Validate replyTo is a plausible email address before including in headers
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const safeReplyTo = emailRegex.test(fromEmail) ? fromEmail : undefined

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: SUPPORT_EMAIL,
      replyTo: safeReplyTo,
      subject: `[Support] ${safeSubject}`,
      html: `
        <p><strong>From:</strong> ${escapeHtml(fromEmail)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
        <hr style="border:none;border-top:1px solid #E0D8F7;margin:16px 0;" />
        <p style="white-space:pre-wrap;">${escapeHtml(message.trim()).replace(/\n/g, '<br>')}</p>
      `,
    })
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to send message.' }
  }
}
