'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  images: string[]
  index: number
  onIndexChange: (index: number) => void
  alt: string
  open: boolean
  onClose: () => void
}

/**
 * Full-viewport slideshow for a ProductCard's photos. Unlike the card's
 * cropped preview, images here are shown uncropped (object-contain) and
 * sized to fit the viewport regardless of their native aspect ratio.
 */
export function ImageLightbox({ images, index, onIndexChange, alt, open, onClose }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function prev() {
    onIndexChange(index === 0 ? images.length - 1 : index - 1)
  }
  function next() {
    onIndexChange(index === images.length - 1 ? 0 : index + 1)
  }

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, images.length])

  if (!open || !mounted) return null

  const hasMultiple = images.length > 1

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/90" aria-hidden="true" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={alt}
        onClick={e => e.stopPropagation()}
        className="relative z-0 max-h-[90vh] max-w-[90vw] object-contain select-none"
      />

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); prev() }}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); next() }}
            aria-label="Next photo"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2"
            onClick={e => e.stopPropagation()}
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onIndexChange(i)}
                aria-label={`Show photo ${i + 1}`}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i === index ? 'bg-white' : 'bg-white/40'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  )
}
