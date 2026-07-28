import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { SHOWCASE_MODE, SHOWCASE_ROUTES, SHOWCASE_BLOCKED_PREFIXES } from '@/lib/showcase/mode'
import { SHOWCASE_WRITE_MESSAGE } from '@/lib/showcase/guard'

// EEA member states + UK + Switzerland — the regions Google's ad-consent
// requirements (and our own CookieConsentBanner suppression) target.
const EEA_UK_CH_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT',
  'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'GB', 'CH',
])

/**
 * Vercel populates x-vercel-ip-country at the edge — no geo-IP service needed.
 * Used to defer to Google's ad-consent CMP (which now has both an EEA/UK/CH
 * message and a U.S. states message published) instead of showing our own
 * generic cookie banner to those visitors too.
 * Only set when missing or changed, so most responses carry no Set-Cookie
 * header and stay cacheable. The 24h maxAge means it re-sets once a day.
 */
function applyRegionCookie(request: NextRequest, response: NextResponse): NextResponse {
  const country = request.headers.get('x-vercel-ip-country') ?? ''
  const region = EEA_UK_CH_COUNTRIES.has(country) ? 'eea' : country === 'US' ? 'us' : 'other'
  if (request.cookies.get('myshiftx-region')?.value !== region) {
    response.cookies.set('myshiftx-region', region, {
      path: '/',
      maxAge: 60 * 60 * 24,
    })
  }
  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Showcase mode: checks that don't need a session, so they run before the
  // Supabase round-trip. See lib/showcase/mode.ts for why this exists. ──
  if (SHOWCASE_MODE) {
    // Nothing mutates. The server actions are already guarded at
    // getActionSession(); this catches the API routes in one rule, including
    // any added later.
    if (
      pathname.startsWith('/api/') &&
      request.method !== 'GET' &&
      request.method !== 'HEAD' &&
      request.method !== 'OPTIONS'
    ) {
      return NextResponse.json({ error: SHOWCASE_WRITE_MESSAGE }, { status: 503 })
    }

    // Registration and the account-recovery flows don't exist. Rewriting to an
    // unmatched path renders app/not-found.tsx with a real 404, so a crawler
    // sees a dead end rather than a login wall. /login is deliberately absent
    // from this list — it still works, it's just unlinked everywhere.
    if (SHOWCASE_BLOCKED_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.rewrite(new URL('/showcase-route-removed', request.url))
    }

    // /preview/* is an implementation detail of the rewrite below. Sending
    // direct hits to the canonical URL keeps the demo from being indexed twice.
    if (pathname === '/preview' || pathname.startsWith('/preview/')) {
      const canonical = (Object.keys(SHOWCASE_ROUTES) as (keyof typeof SHOWCASE_ROUTES)[])
        .find(route => SHOWCASE_ROUTES[route] === pathname)
      return NextResponse.redirect(new URL(canonical ?? '/', request.url))
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  // Log every middleware decision in development to diagnose loops
  if (process.env.NODE_ENV === 'development') {
    const fullPath = request.nextUrl.pathname + (request.nextUrl.search || '')
    console.log(`[MW] ${fullPath} | user=${user?.email ?? 'none'} | err=${error?.message ?? 'none'}`)
  }

  // Showcase mode: serve signed-out visitors the public demo at the real URLs.
  // A rewrite, not a redirect, so the address a crawler indexes stays /wall.
  // Signed-in users fall straight through to the untouched dashboard.
  if (SHOWCASE_MODE && !user) {
    const previewPath = SHOWCASE_ROUTES[pathname as keyof typeof SHOWCASE_ROUTES]
    if (previewPath) {
      const url = request.nextUrl.clone()
      url.pathname = previewPath
      return applyRegionCookie(request, NextResponse.rewrite(url))
    }
  }

  // Public prefixes, i.e. a DENYlist — everything not listed requires a session.
  //
  // This used to be the other way round: an allowlist of protected routes,
  // which fails OPEN. A new page was unprotected unless someone remembered to
  // add it, and the list had already drifted — /calendar, /messages, /boards
  // and /kanban were all missing from it. They were safe only because each
  // page happens to guard itself.
  //
  // Inverted so the default is private. Adding a page now requires a
  // deliberate act to make it public, and forgetting fails closed.
  const PUBLIC_PREFIXES = [
    '/login', '/register', '/forgot-password', '/reset-password', '/verify-email',
    '/about', '/contact', '/privacy', '/terms', '/data-deletion',
    '/blog', '/faq',
    '/for', '/survey', '/upgrade', '/api',
  ]
  const isPublicRoute =
    pathname === '/' ||
    PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))

  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (!isPublicRoute && !user) {
    const url = request.nextUrl.clone()
    // In showcase mode a signed-out visitor must never land on a login wall —
    // that's the exact thing AdSense rejected the site for. Everything still
    // private (/wall/new-shift, /profile, /admin, /boards…) goes home instead,
    // so no crawlable path anywhere on the site dead-ends at /login.
    url.pathname = SHOWCASE_MODE ? '/' : '/login'
    if (SHOWCASE_MODE) url.search = ''
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/wall'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return applyRegionCookie(request, supabaseResponse)
}

export const config = {
  // Skip static assets (any path with a file extension) — they don't need
  // auth/session refresh and were previously triggering getUser() per request.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
