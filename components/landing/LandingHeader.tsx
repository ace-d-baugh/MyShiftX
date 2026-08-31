'use client'

import { useState } from 'react'
import { ChevronDown, LayoutGrid, CalendarDays, MessageSquare, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemedLogo } from '@/components/ui/ThemedLogo'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { SHOWCASE_MODE } from '@/lib/showcase/mode'
import type { GlobalRole } from '@/lib/database.types'
import { buildRoleDropdownItems, DropdownContent, fmtBadge, type DropdownItemDef } from '@/components/layout/AccountDropdown'

/** Public nav shown to signed-out visitors while the site is in showcase mode. */
const PUBLIC_NAV = [
  { href: '/wall', label: 'The Wall' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/messages', label: 'Messages' },
  { href: '/for', label: 'Industries' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

/** The demo sections — where the "Live Demo" CTA would just point at itself. */
const DEMO_ROUTES = ['/wall', '/calendar', '/messages']

interface LandingHeaderProps {
  displayName: string | null
  userRole?: GlobalRole
  isBoardModerator?: boolean
  isLeader?: boolean
  pendingApprovalsCount?: number
  pendingFlagsCount?: number
  unreadMessagesCount?: number
  unreadNotificationsCount?: number
  showUpgrade?: boolean
  /**
   * Current section, e.g. '/wall'. Highlights the matching nav item and sets
   * aria-current. Defaults to the live pathname, so callers rendering this in
   * a layout get it for free — only pass it to override.
   *
   * The demo pages used to ship their own header (ShowcaseNav) purely to get
   * this highlight, at the cost of showing a different, much shorter nav than
   * the rest of the site.
   */
  active?: string
}

export function LandingHeader({
  displayName,
  userRole = 'Guest',
  isBoardModerator = false,
  isLeader = false,
  pendingApprovalsCount = 0,
  pendingFlagsCount = 0,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
  showUpgrade = false,
  active,
}: LandingHeaderProps) {
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isLoggedIn = !!displayName
  // The demo is served by rewriting /wall → /preview/wall, so the path seen
  // here depends on whether it's the server or the client asking. Strip the
  // prefix so both agree on /wall and the highlight doesn't flip on hydration.
  const pathname = usePathname()
  const activeHref = active ?? pathname?.replace(/^\/preview/, '')

  const isAdmin = userRole === 'Admin'
  const showModItems = isBoardModerator || isAdmin
  const hasNotifications = pendingApprovalsCount > 0 || pendingFlagsCount > 0 || unreadMessagesCount > 0 || unreadNotificationsCount > 0

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    window.location.reload()
  }

  // Unlike the dashboard Navbar (which has a separate Wall/Calendar/Messages
  // tab strip), this header has only the one dropdown — so those live here
  // as ordinary items, each carrying its own badge when it has something
  // pending, ahead of the same role-gated items the dashboard menu shows.
  const primaryItems: DropdownItemDef[] = [
    { type: 'link', href: '/wall', label: 'The Wall', icon: LayoutGrid },
    { type: 'link', href: '/calendar', label: 'My Calendar', icon: CalendarDays },
    { type: 'link', href: '/messages', label: 'Messages', icon: MessageSquare, badge: fmtBadge(unreadMessagesCount) },
    { type: 'separator' },
  ]
  const dropdownItems = [
    ...primaryItems,
    ...buildRoleDropdownItems({ isAdmin, showModItems, isLeader, showUpgrade, pendingApprovalsCount, pendingFlagsCount, unreadNotificationsCount }),
  ]

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border animate-slide-down">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={isLoggedIn ? '/wall' : '/'} className="flex flex-row items-center gap-0 align-baseline">
          {/* Full logo (icon + wordmark) at every breakpoint — smaller on mobile */}
          <ThemedLogo priority className="h-10 md:h-14 w-auto" />
        </Link>

        <nav className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-text/70 hover:text-text hover:bg-primary-light/50 transition-colors min-h-0 min-w-0"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="relative">
                  <span className="font-medium">{displayName}</span>
                  {hasNotifications && (
                    <span className="absolute -top-0.5 -right-2 w-2 h-2 rounded-full bg-warning ring-2 ring-card" />
                  )}
                </span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-border bg-card shadow-xl z-50 py-1.5 overflow-hidden"
                  >
                    <DropdownContent
                      items={dropdownItems}
                      handleLogout={handleLogout}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  </div>
                </>
              )}
            </div>
          ) : SHOWCASE_MODE ? (
            /* Showcase mode: a real topic-organised nav instead of auth CTAs.
             * AdSense asks for "an accessible, easy-to-use navigation bar
             * organized by topic", and there is nothing to sign into anyway.
             * Eight items wrapped into pills on mobile, which is why this
             * collapses into a hamburger below md — the wrapped version read
             * as several uneven rows rather than a menu. */
            <>
              <div className="hidden md:flex items-center gap-1">
                {PUBLIC_NAV.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={activeHref === item.href ? 'page' : undefined}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      activeHref === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-text/70 hover:text-primary hover:bg-primary-light/50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {/* Redundant once you're already inside the demo. */}
                {!DEMO_ROUTES.includes(activeHref ?? '') && (
                  <Link
                    href="/wall"
                    className="btn btn-primary text-sm px-4 py-2 min-h-0 h-10 ml-1"
                  >
                    Live Demo
                  </Link>
                )}
              </div>

              <button
                onClick={() => setMobileNavOpen(o => !o)}
                className="md:hidden p-2 rounded-md text-text/60 hover:text-text hover:bg-primary-light transition-colors min-h-0 min-w-0"
                aria-label="Toggle menu"
                aria-haspopup="menu"
                aria-expanded={mobileNavOpen}
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline text-sm px-4 py-2 min-h-0 h-10">
                Log In
              </Link>
              <Link href="/register" className="btn btn-primary text-sm px-4 py-2 min-h-0 h-10">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile nav panel — showcase mode only; the other two states (logged
          in, or the plain Log In/Get Started pair) are already one row. */}
      {SHOWCASE_MODE && !isLoggedIn && mobileNavOpen && (
        <div
          className="md:hidden bg-background border-t border-border shadow-lg"
          style={{ animation: 'navMenuOpen 0.38s ease-out both' }}
        >
          <nav className="px-4 py-2 flex flex-col">
            {PUBLIC_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={activeHref === item.href ? 'page' : undefined}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  activeHref === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-text/70 hover:text-primary hover:bg-primary-light/50'
                )}
              >
                {item.label}
              </Link>
            ))}
            {!DEMO_ROUTES.includes(activeHref ?? '') && (
              <Link
                href="/wall"
                onClick={() => setMobileNavOpen(false)}
                className="btn btn-primary text-sm px-4 py-2 min-h-0 h-10 mt-2"
              >
                Live Demo
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Backdrop — closes the mobile panel when tapping outside it. */}
      {SHOWCASE_MODE && !isLoggedIn && mobileNavOpen && (
        <div
          className="fixed inset-0 z-[49] md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  )
}
