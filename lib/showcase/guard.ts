import { SHOWCASE_MODE } from '@/lib/showcase/mode'

export const SHOWCASE_WRITE_MESSAGE =
  'MyShiftX is in read-only preview mode right now. Posting, trading, and account changes are temporarily disabled.'

/**
 * Refuses any database write while the site is in showcase mode.
 *
 * Anonymous visitors already can't write — they have no session and RLS
 * rejects them. This exists for the cases RLS doesn't cover: a still-signed-in
 * account, a stale client bundle firing an old server action, or a route added
 * later that nobody remembered to think about. It fails closed and it fails
 * loudly rather than silently no-op'ing, so a write attempt shows up in logs.
 *
 * Wired in at the two chokepoints every authenticated action passes through
 * (getActionSession / requireAdminAction in lib/auth/session.ts), plus the
 * handful of writers that bypass them: app/actions/survey.ts and the cron
 * routes under app/api/cron/.
 */
export function assertWritesEnabled(): void {
  if (SHOWCASE_MODE) throw new Error(SHOWCASE_WRITE_MESSAGE)
}
