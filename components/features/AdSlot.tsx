'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

const PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID

interface AdSlotProps {
  /** data-ad-slot ID from the AdSense dashboard. Shows a placeholder until one exists. */
  slotId?: string
  className?: string
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

/**
 * A single ad unit. Renders a styled placeholder when AdSense isn't fully
 * configured yet (no publisher ID or no slotId for this placement); swaps to
 * a real AdSense unit once both exist — no code change needed, just add the
 * slot ID here and set NEXT_PUBLIC_ADSENSE_PUBLISHER_ID.
 */
export function AdSlot({ slotId, className }: AdSlotProps) {
  const configured = Boolean(PUBLISHER_ID && slotId)

  useEffect(() => {
    if (!configured) return
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({})
    } catch {
      // AdSense script not loaded yet or blocked — fail silently, no user-facing error
    }
  }, [configured])

  if (!configured) {
    return (
      <div
        className={cn(
          'flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-card/50 text-text/30 text-xs font-medium',
          className
        )}
      >
        Advertisement
      </div>
    )
  }

  return (
    <ins
      className={cn('adsbygoogle', className)}
      style={{ display: 'block' }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
