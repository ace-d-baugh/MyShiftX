/**
 * Showcase mode — the temporary public, read-only face of MyShiftX.
 *
 * Google rejected the AdSense application because the site is login-gated:
 * middleware.ts denies by default, so a crawler (or a human reviewer) sees
 * /login and nothing else. AdSense requires reviewers to reach real pages by
 * clicking links from the homepage.
 *
 * With this flag on:
 *   - /wall, /calendar and /messages are public and served from fixtures
 *     (app/preview/*), clearly labelled as an interactive demo
 *   - registration and the account-recovery flows 404
 *   - every write path in the app refuses (see lib/showcase/guard.ts)
 *   - /login still works, but nothing links to it
 *
 * Reverting after approval is one environment variable: unset
 * NEXT_PUBLIC_SHOWCASE_MODE in Vercel and redeploy. Same env-gating pattern
 * used by the Gemini import, Stripe checkout, and Web Push features.
 *
 * Read via static `process.env.NEXT_PUBLIC_X` property access (not a dynamic
 * lookup) so Next.js inlines it into the client bundle — matching lib/env.ts.
 */
export const SHOWCASE_MODE = process.env.NEXT_PUBLIC_SHOWCASE_MODE === '1'

/** Routes the demo serves publicly, and the preview page each one is rewritten to. */
export const SHOWCASE_ROUTES = {
  '/wall': '/preview/wall',
  '/calendar': '/preview/calendar',
  '/messages': '/preview/messages',
} as const

/**
 * Account routes that must not exist while the site is in showcase mode.
 * /login is deliberately absent — it keeps working so the owner can still get
 * in; it's simply unlinked from every nav, footer, CTA, and the sitemap.
 */
export const SHOWCASE_BLOCKED_PREFIXES = [
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/survey',
] as const
