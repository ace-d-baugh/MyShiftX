'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendSupportMessage(opts: {
  fromEmail: string
  subject: string
  message: string
}): Promise<{ error?: string }> {
  const { fromEmail, subject, message } = opts

  if (!subject.trim() || !message.trim()) {
    return { error: 'Subject and message are required.' }
  }

  try {
    const { error } = await resend.emails.send({
      from: 'noreply@myshiftx.com',
      to: 'support@myshiftx.com',
      replyTo: fromEmail,
      subject: `[Support] ${subject.trim()}`,
      html: `
        <p><strong>From:</strong> ${fromEmail}</p>
        <p><strong>Subject:</strong> ${subject.trim()}</p>
        <hr style="border:none;border-top:1px solid #E0D8F7;margin:16px 0;" />
        <p style="white-space:pre-wrap;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>
      `,
    })
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to send message.' }
  }
}
