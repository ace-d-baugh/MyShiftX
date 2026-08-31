// Loads the right Sentry config per runtime. Requires experimental.instrumentationHook
// in next.config.mjs (Next 14 doesn't enable it by default). Both configs no-op when
// NEXT_PUBLIC_SENTRY_DSN is unset — see feature-gating-pattern in memory.
//
// No onRequestError export: that instrumentation hook (auto-captures nested Server
// Component errors) doesn't exist until Next 15 — we're on 14.2. global-error.tsx
// plus Sentry's own uncaught-exception/rejection handlers cover the rest.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
