import { createHmac, timingSafeEqual } from 'crypto'

// Task 22: the weekly-digest unsubscribe link is a plain GET from an email
// client, so it carries an HMAC of the user id (keyed with CRON_SECRET)
// instead of a session. Server-only — never import from client components.

export function digestUnsubscribeSig(userId: string, secret: string): string {
  return createHmac('sha256', secret).update(userId).digest('hex')
}

export function verifyDigestUnsubscribeSig(userId: string, sig: string, secret: string): boolean {
  const expected = Buffer.from(digestUnsubscribeSig(userId, secret), 'hex')
  let provided: Buffer
  try {
    provided = Buffer.from(sig, 'hex')
  } catch {
    return false
  }
  return expected.length === provided.length && timingSafeEqual(expected, provided)
}
