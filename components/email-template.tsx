// Shared email template helpers — used by transactional emails sent via Resend.
// All functions return an HTML string safe to pass to resend.emails.send().

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myshiftx.com'

// ── Shell (header + footer wrapping all emails) ────────────────────────────────
// Header matches the confirm-email-template gradient style.
// Google Fonts loads in Apple Mail / iOS Mail only; Arial/Georgia cover everyone else.

const shell = (body: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyShiftX</title>
  <link href="https://fonts.googleapis.com/css2?family=Philosopher:wght@700&family=Lato:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f5f0ff;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f5f0ff;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;width:100%;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center"
                style="
                  background-color:#F0E2FF;
                  background-image:
                    linear-gradient(148deg, rgba(255,255,255,0.25) 0%, transparent 38%),
                    linear-gradient(135deg, rgba(60,0,140,0.38)    0%, transparent 52%),
                    linear-gradient(315deg, rgba(70,5,150,0.34)     0%, transparent 52%),
                    linear-gradient(225deg, rgba(50,0,130,0.26)    0%, transparent 48%),
                    linear-gradient(45deg,  rgba(65,5,145,0.24)    0%, transparent 48%);
                  padding:32px 24px;
                  text-align:center;
                ">
              <p style="margin:0;font-family:'Philosopher',Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#BD80FF;letter-spacing:-0.5px;line-height:1;">
                My<span style="font-size:32px;">ShiftX</span>
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#F2E6FF;border-top:1px solid #E0D8F7;text-align:center;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#2F2040;line-height:1.5;">
                Questions? <a href="mailto:support@myshiftx.com" style="color:#BD80FF;text-decoration:none;">support@myshiftx.com</a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9b8ab4;line-height:1.5;">
                You received this because you have an account on
                <a href="${BASE_URL}" style="color:#BD80FF;text-decoration:none;">myshiftx.com</a>
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

// ── Primitive helpers ──────────────────────────────────────────────────────────

const btn = (href: string, label: string) => `
  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
    <tr>
      <td align="center" style="background:#BD80FF;border-radius:8px;">
        <a href="${href}"
           style="display:inline-block;padding:14px 28px;font-family:'Lato',Arial,Helvetica,sans-serif;
                  font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;
                  border-radius:8px;letter-spacing:0.2px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`

const h1 = (text: string) =>
  `<h1 style="margin:0 0 12px;font-family:'Philosopher',Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#2f2040;">${text}</h1>`

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#5a4a6e;">${text}</p>`

const muted = (text: string) =>
  `<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9b8ab4;line-height:1.5;">${text}</p>`

const highlight = (text: string) =>
  `<p style="margin:0 0 24px;padding:16px 20px;background-color:#F2E6FF;border-left:4px solid #BD80FF;
             border-radius:4px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;
             color:#2f2040;line-height:1.4;">${text}</p>`

// ── Templates ──────────────────────────────────────────────────────────────────

/** Supabase passes {{ .ConfirmationURL }} — paste into the Supabase email template editor */
export const verifyEmailHtml = (confirmUrl: string, displayName?: string) =>
  shell(`
    ${h1('Confirm your email address')}
    ${p(`Hi${displayName ? ` ${displayName}` : ''},`)}
    ${p('Thanks for signing up! Click the button below to verify your email address and activate your MyShiftX account.')}
    ${btn(confirmUrl, 'Confirm Email Address')}
    ${muted("This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.")}
  `)

/** Password reset email */
export const resetPasswordHtml = (resetUrl: string) =>
  shell(`
    ${h1('Reset your password')}
    ${p("We received a request to reset the password for your MyShiftX account.")}
    ${btn(resetUrl, 'Reset Password')}
    ${muted("This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.")}
  `)

/** Sent to a post owner when someone marks interest on their shift or request */
export const interestedHtml = (opts: {
  commenterName: string
  postTitle: string
  postType: 'shift' | 'request'
  wallUrl: string
}) =>
  shell(`
    ${h1('Someone is interested! ⭐')}
    ${p(`<strong>${opts.commenterName}</strong> just marked interest in your ${opts.postType === 'shift' ? 'shift offer' : 'shift request'}:`)}
    ${highlight(opts.postTitle)}
    ${p('Head to The Wall to connect with them.')}
    ${btn(opts.wallUrl, 'Go to The Wall')}
    ${muted('You can turn off email notifications in your profile settings.')}
  `)

/** Generic notification — available for future use */
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
