import * as Sentry from '@sentry/nextjs'

// No-op until NEXT_PUBLIC_SENTRY_DSN is set (Vercel/local env) — feature-gating-pattern.
// Crash reporting + tracing only: no session replay, no logging, no dataCollection
// override (SDK default is already conservative). Doesn't need a slot in
// CookieConsentBanner for the same reason Supabase's auth cookie doesn't — it sets
// no tracking cookie and carries nothing beyond the exception itself.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  })
}
