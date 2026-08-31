import { withSentryConfig } from '@sentry/nextjs/config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Let verification builds run alongside `next dev` without the two fighting
  // over .next (which corrupts page-data collection). Unset = normal .next,
  // so Vercel and `npm run build` are unaffected.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async redirects() {
    return [
      { source: '/board',          destination: '/wall',          permanent: true },
      { source: '/board/:path*',   destination: '/wall/:path*',   permanent: true },
      // The six per-industry landing pages were consolidated into /for. These
      // URLs were indexed, so they redirect rather than 404 — "links leading to
      // missing pages" is itself one of the low-value-content triggers.
      { source: '/for/:slug',      destination: '/for',           permanent: true },
    ]
  },
  experimental: {
    // Disable the client-side Router Cache for dynamic routes.
    // Without this, a server-side redirect() gets cached by the browser router
    // and causes an infinite HandleRedirect loop (wall → /login → wall...).
    // This is the documented @supabase/ssr fix for Next.js 14.2+.
    staleTimes: {
      dynamic: 0,
    },
    // Next 14 doesn't enable instrumentation.ts by default (stable without the
    // flag since Next 15) — required for Sentry's server/edge init.
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      '@supabase/ssr',
      '@supabase/supabase-js',
      '@supabase/postgrest-js',
      '@supabase/realtime-js',
      '@supabase/storage-api',
      '@supabase/functions-js',
      '@supabase/node-fetch',
    ],
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Upload a wider set of client source files so stack traces resolve to real
  // filenames/lines rather than bundle chunk names.
  widenClientFileUpload: true,
  // No-op (skips source map upload, no console noise) until org/project/token are set.
  silent: true,
  webpack: { treeshake: { removeDebugLogging: true } },
})
