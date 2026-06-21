// Shared email template helpers — used by transactional emails sent via Resend.
// All functions return an HTML string safe to pass to resend.emails.send().

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myshiftx.com'

const shell = (body: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyShiftX</title>
</head>
<body style="margin:0;padding:0;background:#f5f0ff;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ff;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#bd80ff;padding:28px 32px;">
              <p style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                My<span style="font-size:22px;font-weight:600;">ShiftX</span>
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:0.5px;">
                SHIFT TRADING MADE EASY
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f0eafa;">
              <p style="margin:0;font-size:12px;color:#9b8ab4;text-align:center;">
                MyShiftX · <a href="${BASE_URL}" style="color:#bd80ff;text-decoration:none;">myshiftx.com</a>
                <br/>You received this email because you have an account on MyShiftX.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const btn = (href: string, label: string) => `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#bd80ff;border-radius:8px;">
        <a href="${href}"
           style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;
                  color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`

const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2f2040;">${text}</h1>`

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5a4a6e;">${text}</p>`

const muted = (text: string) =>
  `<p style="margin:16px 0 0;font-size:12px;color:#9b8ab4;">${text}</p>`

// ── Templates ─────────────────────────────────────────────────────────────────

/** Supabase passes {{ .ConfirmationURL }} — paste this into the Supabase email template */
export const verifyEmailHtml = (confirmUrl: string, displayName?: string) =>
  shell(`
    ${h1('Confirm your email address')}
    ${p(`Hi${displayName ? ` ${displayName}` : ''},`)}
    ${p('Thanks for signing up! Click the button below to verify your email address and activate your MyShiftX account.')}
    ${btn(confirmUrl, 'Confirm Email Address')}
    ${muted(`This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.`)}
  `)

/** Password reset email */
export const resetPasswordHtml = (resetUrl: string) =>
  shell(`
    ${h1('Reset your password')}
    ${p("We received a request to reset the password for your MyShiftX account.")}
    ${btn(resetUrl, 'Reset Password')}
    ${muted("This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.")}
  `)

/** Generic notification — used for future shift alert emails */
export const notificationHtml = (opts: {
  title: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
}) =>
  shell(`
    ${h1(opts.title)}
    ${p(opts.body)}
    ${opts.ctaLabel && opts.ctaUrl ? btn(opts.ctaUrl, opts.ctaLabel) : ''}
  `)
