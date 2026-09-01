'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { HouseAd } from './HouseAd'

const PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
// Ad units (client ID + slot IDs) are already fully configured in AdSense —
// they were created before the account was approved, and they don't need to
// change once it is. So "the slot ID exists" can't be the signal for "show
// a real ad here"; an empty <ins> just silently renders nothing while
// unapproved. This is the explicit, manually-flipped switch instead — same
// one-env-var-revert pattern as NEXT_PUBLIC_SHOWCASE_MODE. Flip it to '1'
// once the account clears review.
const ADSENSE_APPROVED = process.env.NEXT_PUBLIC_ADSENSE_APPROVED === '1'

interface AdSlotProps {
  /** data-ad-slot ID from the AdSense dashboard. Shows a placeholder until one exists. */
  slotId?: string
  /** Fixed pixel size, matching how the unit was created in AdSense. Omit for a responsive/auto unit. */
  width?: number
  height?: number
  className?: string
  /** Distinguishes stacked slots on the same page when falling back to a
   * house ad, so e.g. a 3-slot rail shows 3 different posts. Ignored once a
   * real ad renders — Google already varies real ad content per unit. */
  offset?: number
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

/**
 * A single ad unit. Renders a house ad (see HouseAd.tsx) until the site is
 * both fully wired up (publisher ID + slotId for this placement) AND the
 * AdSense account itself is approved; swaps to the real unit once all three
 * are true — no code change needed at approval time, just flip
 * NEXT_PUBLIC_ADSENSE_APPROVED to '1'.
 *
 * Mirrors whatever AdSense actually generated for the unit (fixed size vs.
 * auto/responsive) rather than forcing one format, since ad units are
 * configured per-slot in the AdSense dashboard.
 */
export function AdSlot({ slotId, width, height, className, offset }: AdSlotProps) {
  const configured = Boolean(PUBLISHER_ID && slotId && ADSENSE_APPROVED)
  const fixedSize = width !== undefined && height !== undefined

  useEffect(() => {
    if (!configured) return
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({})
    } catch {
      // AdSense script not loaded yet or blocked — fail silently, no user-facing error
    }
  }, [configured])

  if (!configured) {
    return <HouseAd width={width} height={height} className={className} offset={offset} />
  }

  return (
    <ins
      className={cn('adsbygoogle', className)}
      style={fixedSize ? { display: 'inline-block', width, height } : { display: 'block' }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={slotId}
      {...(!fixedSize && { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' })}
    />
  )
}
