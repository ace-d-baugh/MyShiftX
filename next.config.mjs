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

export default nextConfig
