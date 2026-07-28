'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Crown } from 'lucide-react'
import { AdSlot } from './AdSlot'
import { cn } from '@/lib/utils'

// Pages that get an ad slot. Everything else (landing pages, auth/OAuth
// pages, admin tools, the Kanban roadmap) stays ad-free.
const AD_ENABLED_PATHS = new Set([
  '/wall',
  '/calendar',
  '/profile',
  '/messages',
  '/leader/approvals',
  '/leader/flags',
  '/leader/archive',
  '/help',
  '/terms',
  '/privacy',
  '/data-deletion',
  '/about',
  '/contact',
  '/faq',
  '/blog',
  // Showcase mode serves these at /wall, /calendar and /messages via an
  // internal rewrite. usePathname() reports the rewritten path on the server
  // and the browser path on the client, so both spellings have to be listed
  // or the two disagree and hydration blows up.
  '/preview/wall',
  '/preview/calendar',
  '/preview/messages',
])

function isAdEnabledPath(pathname: string): boolean {
  if (AD_ENABLED_PATHS.has(pathname)) return true
  if (/^\/boards\/[^/]+$/.test(pathname)) return true // individual board (members) page, not the /boards list
  if (/^\/messages\/[^/]+$/.test(pathname)) return true // individual conversation threads
  return false
}

const STICKY_DESKTOP_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_DESKTOP
const STICKY_MOBILE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_MOBILE

interface AdRailProps {
  showAds: boolean
  children: React.ReactNode
  /** False for standalone pages (Terms, Privacy, Data Deletion) that render
   * outside the dashboard layout and have no bottom nav for the mobile ad
   * bar to sit above. Defaults to true (the dashboard's normal layout). */
  hasBottomNav?: boolean
}

/**
 * Wraps page content with a sticky ad slot: right rail on desktop/tablet
 * (reserves real layout space so it never overlaps centered page content),
 * sticky bottom bar on mobile (sits just above the existing bottom nav).
 * Renders nothing extra when ads shouldn't show here.
 */
export function AdRail({ showAds, children, hasBottomNav = true }: AdRailProps) {
  const pathname = usePathname()
  const enabled = showAds && isAdEnabledPath(pathname)

  return (
    <div className="flex">
      <div className="flex-1 min-w-0">
        {children}
        {enabled && <div className="lg:hidden h-24" aria-hidden="true" />}
      </div>

      {enabled && (
        <aside className="hidden lg:block w-[300px] shrink-0 pr-4">
          <div className="sticky top-28">
            <Link
              href="/upgrade"
              className="mb-1 flex items-center justify-end gap-1 text-[11px] font-medium text-text/60 hover:text-text min-h-0 min-w-0"
            >
              <Crown className="w-3.5 h-3.5 text-secondary-accent" fill="#ffea80" strokeWidth={0} aria-hidden="true" />
              Remove Ads
            </Link>
            <AdSlot slotId={STICKY_DESKTOP_SLOT} className="w-full min-h-[250px]" />
          </div>
        </aside>
      )}

      {enabled && (
        <div
          className={cn(
            'lg:hidden fixed inset-x-0 z-40 px-2 py-1 bg-card/95 backdrop-blur-sm border-t border-border',
            // The bottom tab nav is md:hidden, so only offset above it below
            // md; from md to lg the bar sits flush with the bottom edge.
            hasBottomNav ? 'bottom-14 md:bottom-0' : 'bottom-0'
          )}
        >
          {/* "Remove Ads" tab perched on the bar's top edge; the SVG draws the
           * ogee flare that sweeps its top-left edge down into the bar. h-6
           * matches the 24-unit viewBox so the curve isn't stretched. */}
          <Link
            href="/upgrade"
            className="absolute bottom-full right-3 flex h-6 items-center gap-1 rounded-tr-lg border-t border-r border-border bg-card/95 backdrop-blur-sm pr-2.5 pl-1 text-[11px] font-medium leading-none text-text/70 min-h-0 min-w-0"
          >
            <svg
              aria-hidden="true"
              className="absolute right-full bottom-0 h-full w-4"
              viewBox="0 0 16 24"
              preserveAspectRatio="none"
            >
              <path d="M16 0 C7 0 9 24 0 24 L16 24 Z" className="fill-card/95" />
              <path
                d="M16 0 C7 0 9 24 0 24"
                fill="none"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="stroke-border"
              />
            </svg>
            <Crown className="w-3.5 h-3.5 text-secondary-accent" fill="#ffea80" strokeWidth={0} aria-hidden="true" />
            Remove Ads
          </Link>
          <AdSlot slotId={STICKY_MOBILE_SLOT} className="w-full max-w-md mx-auto h-16" />
        </div>
      )}
    </div>
  )
}
