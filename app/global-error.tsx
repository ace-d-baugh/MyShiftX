'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// Replaces the root layout when an error escapes every other boundary, so it
// needs its own <html>/<body>. Reports the crash to Sentry (no-ops if unconfigured)
// and gives the user a way back instead of a blank screen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: 'sans-serif', textAlign: 'center', padding: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: '#666' }}>We&apos;ve been notified and are looking into it.</p>
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '0.375rem', border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
