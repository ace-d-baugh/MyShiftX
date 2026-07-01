'use client'

import { usePathname } from 'next/navigation'
import { AdSlot } from './AdSlot'

// Pages that get an ad slot. Everything else (landing pages, auth/OAuth
// pages, admin tools, the Kanban roadmap) stays ad-free.
const AD_ENABLED_PATHS = new Set([
  '/wall',
  '/calendar',
  '/profile',
  '/leader/approvals',
  '/leader/flags',
  '/leader/archive',
  '/help',
])

function isAdEnabledPath(pathname: string): boolean {
  if (AD_ENABLED_PATHS.has(pathname)) return true
  if (/^\/boards\/[^/]+$/.test(pathname)) return true // individual board (members) page, not the /boards list
  return false
}

const STICKY_DESKTOP_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_DESKTOP
const STICKY_MOBILE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_MOBILE

interface AdRailProps {
  showAds: boolean
  children: React.ReactNode
}

/**
 * Wraps page content with a sticky ad slot: right rail on desktop/tablet
 * (reserves real layout space so it never overlaps centered page content),
 * sticky bottom bar on mobile (sits just above the existing bottom nav).
 * Renders nothing extra when ads shouldn't show here.
 */
export function AdRail({ showAds, children }: AdRailProps) {
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
            <AdSlot slotId={STICKY_DESKTOP_SLOT} className="w-full min-h-[250px]" />
          </div>
        </aside>
      )}

      {enabled && (
        <div className="lg:hidden fixed bottom-14 inset-x-0 z-40 px-2 py-1 bg-card/95 backdrop-blur-sm border-t border-border">
          <AdSlot slotId={STICKY_MOBILE_SLOT} className="w-full max-w-md mx-auto h-16" />
        </div>
      )}
    </div>
  )
}
