'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Crown } from 'lucide-react'
import { AdSlot } from './AdSlot'
import { cn } from '@/lib/utils'

// Pages that get an ad slot. Everything else (landing pages, auth/OAuth
// pages, admin tools, the Kanban roadmap) stays ad-free.
//
// Deliberately EXCLUDED, and not to be re-added without re-reading the policy:
// Google's "Google-served ads on screens without publisher-content" policy
// (support.google.com/publisherpolicies/answer/11112688 — it governs AdSense,
// AdMob and Ad Manager alike) bars ads on screens that carry no publisher
// content or exist "for alerts, navigation or other behavioral purposes".
//   - /calendar + /preview/calendar — a month grid is a navigation surface
//   - /messages + /messages/[id] + /preview/messages — a private inbox has no
//     publisher content at all, and ads against private mail cost user trust
//     in a product whose whole pitch is being more trustworthy than a group chat
//   - shift create/edit — forms are dead-end/behavioral screens
// The Wall stays: a UGC feed is a forum, which is an established permitted
// category. It still needs an AdSense crawler login before it can serve
// targeted ads once the app is gated again (that's configurable only after
// the account is approved — support.google.com/adsense/answer/161351).
const AD_ENABLED_PATHS = new Set([
  '/wall',
  '/profile',
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
  // Showcase mode serves the demo Wall at /wall via an internal rewrite.
  // usePathname() reports the rewritten path on the server and the browser
  // path on the client, so both spellings have to be listed or the two
  // disagree and hydration blows up.
  '/preview/wall',
])

function isAdEnabledPath(pathname: string): boolean {
  if (AD_ENABLED_PATHS.has(pathname)) return true
  if (/^\/boards\/[^/]+$/.test(pathname)) return true // individual board (members) page, not the /boards list
  if (/^\/blog\/[^/]+$/.test(pathname)) return true // individual post — was missing entirely; only the /blog index matched
  return false
}

const STICKY_DESKTOP_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_DESKTOP
const STICKY_DESKTOP_SLOT_2 = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_DESKTOP_2
const STICKY_DESKTOP_SLOT_3 = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_DESKTOP_3
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
        {/* Clearance so the fixed bottom bar never covers the end of the page.
         * Sized to the bar itself (50px ad + 8px padding + 1px border) plus the
         * "Remove Ads" tab that perches above it. */}
        {enabled && <div className="lg:hidden h-20" aria-hidden="true" />}
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
            {/* All three show from lg up, same breakpoint as the rail
             * itself — was xl-only, but that put the 3-column layout out of
             * reach on a lot of real laptop screens once OS display scaling
             * is factored in, not just narrow windows. */}
            <div className="flex flex-col gap-4">
              <AdSlot slotId={STICKY_DESKTOP_SLOT} offset={0} className="w-full min-h-[250px]" />
              <AdSlot slotId={STICKY_DESKTOP_SLOT_2} offset={1} className="w-full min-h-[250px]" />
              <AdSlot slotId={STICKY_DESKTOP_SLOT_3} offset={2} className="w-full min-h-[250px]" />
            </div>
          </div>
        </aside>
      )}

      {enabled && (
        <div
          className={cn(
            // No horizontal padding: the ad below is a fixed 320px unit, and
            // on a 320px-wide phone any padding would push it into overflow.
            // flex+justify-center centers the inline-block <ins> (mx-auto
            // does not, which is why this isn't just a text-center block).
            'lg:hidden fixed inset-x-0 z-40 flex justify-center py-1 bg-card/95 backdrop-blur-sm border-t border-border',
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
          {/* Fixed 320x50 anchor banner, NOT a responsive/auto unit. An auto
           * unit with data-full-width-responsive lets AdSense pick the size,
           * and on a phone it picks a large rectangle — which is how this bar
           * grew to half the viewport. A fixed size is also the only way to
           * bound it honestly: clipping an oversized ad with overflow-hidden
           * would breach the policy against obscuring ads. */}
          <AdSlot slotId={STICKY_MOBILE_SLOT} width={320} height={50} />
        </div>
      )}
    </div>
  )
}
