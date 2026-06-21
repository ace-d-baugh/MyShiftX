import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = 'MyShiftX <noreply@myshiftx.com>'

// ── POST /api/send ────────────────────────────────────────────────────────────
// Generic transactional email endpoint. Called server-side only.
// Body: { to, subject, html }

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json()

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing to, subject, or html' }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })

    if (error) {
      console.error('[Resend] send error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data?.id })
  } catch (err) {
    console.error('[Resend] unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
