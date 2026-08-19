'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff, Star, ExternalLink, Expand } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageLightbox } from './ImageLightbox'

const AUTOPLAY_MS = 4500

export interface ProductCardProps {
  /** Product name, e.g. "NICETOWN 100% Blackout Curtains" */
  name: string
  /** Superlative shown as a badge, e.g. "Best Overall Value" */
  badge?: string
  /** Local image paths (/products/...). Omit or leave empty for a placeholder. */
  images?: string[]
  /**
   * MyShiftX's own editorial rating out of 5 — not Amazon's. We don't have
   * Product Advertising API access, so this is never live review data; leave
   * it unset until there's a real number to put here.
   */
  rating?: number
  pros: string[]
  cons: string[]
  bestFor: string
  /** Affiliate link */
  href: string
  ctaLabel?: string
}

export function ProductCard({
  name,
  badge,
  images = [],
  rating,
  pros,
  cons,
  bestFor,
  href,
  ctaLabel = 'Check Current Price on Amazon',
}: ProductCardProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const hasImages = images.length > 0
  const hasMultiple = images.length > 1
  // Bumped on any manual nav so the autoplay interval restarts its countdown
  // from that point rather than jumping again a moment later.
  const [resetTick, setResetTick] = useState(0)
  const imagesLength = images.length

  useEffect(() => {
    if (!hasMultiple || paused || lightboxOpen) return
    const id = setInterval(() => {
      setIndex(i => (i === imagesLength - 1 ? 0 : i + 1))
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [hasMultiple, paused, lightboxOpen, imagesLength, resetTick])

  function goTo(i: number) {
    setIndex(i)
    setResetTick(t => t + 1)
  }
  function prev() {
    goTo(index === 0 ? images.length - 1 : index - 1)
  }
  function next() {
    goTo(index === images.length - 1 ? 0 : index + 1)
  }

  return (
    <div
      className="not-prose card overflow-hidden p-0 my-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-secondary/30">
        {hasImages ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`View full-size photo of ${name}`}
            className="group/img relative block h-full w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[index]}
              alt={name}
              className="h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/img:bg-black/20 group-hover/img:opacity-100">
              <Expand className="w-6 h-6 text-white drop-shadow" />
            </span>
          </button>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-text/30">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs font-medium">Product photo coming soon</span>
          </div>
        )}

        {badge && (
          <span className="absolute top-3 left-3 badge bg-primary text-white shadow-sm">
            {badge}
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-text shadow-sm hover:bg-background"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-text shadow-sm hover:bg-background"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    i === index ? 'bg-white' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-5">
        <h4 className="font-accent text-lg font-bold text-text mb-1">{name}</h4>

        {typeof rating === 'number' && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex" aria-hidden="true">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={cn(
                    'w-3.5 h-3.5',
                    n <= Math.round(rating) ? 'fill-primary text-primary' : 'fill-none text-text/20'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-text/45">{rating.toFixed(1)}/5 &mdash; MyShiftX editorial rating</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 mb-4 text-sm">
          <div>
            <p className="font-semibold text-success mb-1">Pros</p>
            <ul className="list-disc pl-4 space-y-0.5 text-text/70">
              {pros.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-text/60 mb-1">Cons</p>
            <ul className="list-disc pl-4 space-y-0.5 text-text/70">
              {cons.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>

        <p className="text-sm text-text/60 mb-4">
          <span className="font-semibold text-text/75">Best for:</span> {bestFor}
        </p>

        <a
          href={href}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="btn btn-primary gap-2 w-full sm:w-auto"
        >
          {ctaLabel}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {hasImages && (
        <ImageLightbox
          images={images}
          index={index}
          onIndexChange={goTo}
          alt={name}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}
