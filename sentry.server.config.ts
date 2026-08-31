import * as Sentry from '@sentry/nextjs'

// No-op until NEXT_PUBLIC_SENTRY_DSN is set (Vercel/local env) — feature-gating-pattern.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  })
}
