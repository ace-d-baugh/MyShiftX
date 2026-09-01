'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

interface AvatarProps {
  avatarUrl?: string | null
  displayName?: string | null
  /** Diameter in px. */
  size?: number
  className?: string
  /** Color applied to the fallback icon when there's no image — callers pass
   *  their existing type/accent color to keep that language (e.g. ShiftCard's
   *  trade/giveaway hue). Deliberately NOT applied to the fallback letter;
   *  see the contrast note below. */
  tintClassName?: string
  /** Clicking an image avatar opens a lightbox. No-op on the fallback state. */
  clickable?: boolean
}

// Just the first letter of the first name/display name — two-letter initials
// were hard to read at the small sizes this renders at, especially on the
// light theme.
function firstLetterFrom(name?: string | null): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0]!.toUpperCase() : ''
}

export function Avatar({
  avatarUrl, displayName, size: sizeProp = 32, className, tintClassName = 'text-primary', clickable = true,
}: AvatarProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  // Never render smaller than 20px — below that a circle reads as a smudge,
  // not an identity.
  const size = Math.max(sizeProp, 20)
  const dimension = { width: size, height: size }
  const alt = displayName ? `${displayName}'s profile picture` : 'Profile picture'

  if (avatarUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- real remote Storage URL, but this app doesn't use next/image anywhere; staying consistent */}
        <img
          src={avatarUrl}
          alt={alt}
          style={dimension}
          onClick={clickable ? () => setLightboxOpen(true) : undefined}
          className={cn(
            'rounded-full object-cover shrink-0 bg-primary-light',
            clickable && 'cursor-pointer',
            className
          )}
        />
        {clickable && (
          <Modal open={lightboxOpen} onClose={() => setLightboxOpen(false)} size="md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt={alt} className="w-full h-auto rounded-lg" />
          </Modal>
        )}
      </>
    )
  }

  const initial = firstLetterFrom(displayName)
  // Fit to the two sizes actually in use — Profile's 40px circle wants 28px
  // text, the 20px circles elsewhere want 14px.
  const initialFontSize = Math.round(size * 0.7)
  return (
    <span
      style={dimension}
      className={cn(
        'rounded-full bg-primary-light flex items-center justify-center shrink-0 font-semibold no-underline',
        tintClassName,
        className
      )}
    >
      {initial
        ? (
          // text-text overrides the inherited tintClassName color. The tint
          // tokens are pastel-light by design — tuned for icon strokes and
          // badge fills, not small foreground text. Measured against this
          // app's own light theme (bg-primary-light = hsl(269 100% 95%)),
          // every one of them fails WCAG AA's 4.5:1 for normal text:
          // success 1.26:1, info 1.36:1, warning 1.54:1, accent 1.71:1,
          // primary 2.28:1 — functionally invisible, not merely low-contrast.
          // --color-text measures 11.45:1 against the same background and is
          // the app's guaranteed-readable body color in every theme.
          // lineHeight: 1 — text's default line box is taller than the glyph
          // itself, which throws off the parent's flex-centering.
          <span className="flex items-center justify-center text-text" style={{ fontSize: initialFontSize, lineHeight: 1 }}>
            {initial}
          </span>
        )
        : <User size={size * 0.55} />}
    </span>
  )
}
