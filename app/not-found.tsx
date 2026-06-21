'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, ArrowRight, Compass, Clock, Star } from 'lucide-react'

interface FallingStar {
  id: number
  left: number
  size: number
  duration: number
  delay: number
  opacity: number
  color: 'text-accent' | 'text-[#FFEA80]'
}

// Must match the translateX magnitude in the `starFall` keyframe (tailwind.config.ts).
const STAR_DRIFT_VH = 66
const STAR_DENSITY = 0.25 // stars per percentage-point of horizontal spawn range
const MIN_STARS = 18
const MAX_STARS = 50

const QUIPS = [
  'This page called out sick today.',
  'Looks like this page already got picked up by another user.',
  "This shift never made it onto the board.",
  'Status: expired, just like every other shift post.',
  "This page swapped with someone else and didn't tell us.",
  'This page was took a vacation day.',
  'This page is on a break — an unscheduled one.',
  'This page is a no-call, no-show.',
  'You need at least 8 hours of rest between viewing the last page and trying to view this one.',
  'This page is pending union arbitration.',
  'This page clocked out early.',
]

export default function NotFound() {
  const [quip, setQuip] = useState(QUIPS[0])
  const [stars, setStars] = useState<FallingStar[]>([])

  useEffect(() => {
    setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)])

    // Every star drifts left by STAR_DRIFT_VH while falling (the -30deg angle),
    // so spawning only across 0-100% leaves the lower-right empty — nothing
    // ever starts far enough right to still be drifting through that area by
    // the time it reaches the bottom. How much of the width that drift eats
    // up depends on aspect ratio (the drift is fixed in vh, not vw), so widen
    // the spawn range to the right by that amount and scale the star count to
    // match, keeping on-screen density even across the wider band.
    const driftPercentOfWidth = (STAR_DRIFT_VH * window.innerHeight) / window.innerWidth
    const rangeWidth = 100 + driftPercentOfWidth
    const count = Math.min(MAX_STARS, Math.max(MIN_STARS, Math.round(rangeWidth * STAR_DENSITY)))
    const bandWidth = rangeWidth / count
    setStars(
      Array.from({ length: count }, (_, i) => {
        const duration = 5 + Math.random() * 5
        return {
          id: i,
          left: i * bandWidth + Math.random() * bandWidth * 0.7,
          size: 10 + Math.random() * 8,
          duration,
          // Negative delay starts each star already mid-flight so the field
          // looks like it's been falling the whole time, not just kicking off.
          delay: -(Math.random() * duration),
          opacity: 0.5 + Math.random() * 0.5,
          color: Math.random() < 0.5 ? 'text-accent' : 'text-[#FFEA80]',
        } as FallingStar
      })
    )
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-light via-background to-background relative overflow-hidden">

      {/* Animated background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-secondary/30 blur-3xl animate-blob"
          style={{ animationDelay: '3s' }}
        />
        <div
          className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl animate-blob"
          style={{ animationDelay: '6s' }}
        />
      </div>

      {/* Falling stars */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {stars.map(star => (
          <Star
            key={star.id}
            className={`falling-star animate-star-fall absolute top-0 ${star.color} fill-current`}
            style={{
              left: `${star.left}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationName: 'starFall',
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>

      {/* Brand lockup */}
      <header className="relative z-10 px-4 py-6 animate-slide-down">
        <Link href="/" className="inline-flex items-center gap-0 align-baseline">
          <Image
            src="/logos/ShiftX-logo.svg"
            alt="MyShiftX Logo"
            width={1560}
            height={500}
            className="h-12 w-auto"
          />
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-12">

        {/* Floating compass — even shift trading needs a guide sometimes */}
        <div className="animate-float mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center
            bg-white/10 backdrop-blur-sm
            ring-1 ring-primary/20">
            <Compass className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* 404 */}
        <h1
          className="font-accent text-7xl md:text-9xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-fade-in-up"
          style={{ animationDelay: '0ms' }}
        >
          404
        </h1>

        <h2
          className="font-accent text-2xl md:text-3xl font-bold text-text mb-3 animate-fade-in-up"
          style={{ animationDelay: '120ms' }}
        >
          This Shift Got Picked Up
        </h2>

        <p
          className="text-text/60 text-base md:text-lg max-w-md mx-auto mb-6 animate-fade-in-up"
          style={{ animationDelay: '220ms' }}
        >
          The page you&apos;re looking for doesn&apos;t exist anymore — or maybe it never did.
          Let&apos;s get you back on schedule.
        </p>

        <div className="animate-fade-in-up mb-10" style={{ animationDelay: '320ms' }}>
          <span className="badge bg-warning/15 text-warning inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {quip}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '420ms' }}>
          <Link href="/" className="btn btn-primary text-base px-8 py-3 min-h-0 h-12 gap-2 group">
            <Home className="w-5 h-5" />
            Back to Home
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link href="/wall" className="btn btn-outline text-base px-8 py-3 min-h-0 h-12">
            Browse The Wall
          </Link>
        </div>
      </main>
    </div>
  )
}
