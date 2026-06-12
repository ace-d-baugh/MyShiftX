/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable the client-side Router Cache for dynamic routes.
    // Without this, a server-side redirect() gets cached by the browser router
    // and causes an infinite HandleRedirect loop (board → /login → board...).
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
