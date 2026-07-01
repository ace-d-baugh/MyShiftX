'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

// Flip to true once Task 12 (Ad System / Google AdSense) actually ships.
// Right now the only cookies MyShiftX sets are Supabase Auth session cookies,
// which are "strictly necessary" and exempt from consent requirements under
// GDPR/ePrivacy and CCPA — showing this banner before there are any
// non-essential (ad/analytics) cookies would just be friction with no legal
// purpose. The banner and its accept/decline storage are already built so
// this is a one-line flip when ads go live.
const COOKIE_BANNER_ENABLED = false

const STORAGE_KEY = 'myshiftx-cookie-consent'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!COOKIE_BANNER_ENABLED) return
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  const respond = (choice: 'accepted' | 'declined') => {
    try { localStorage.setItem(STORAGE_KEY, choice) } catch {}
    setVisible(false)
  }

  if (!COOKIE_BANNER_ENABLED || !visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] bg-card border-t border-border shadow-lg animate-slide-up">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
        <p className="text-sm text-text/70 flex-1">
          We use cookies to keep you signed in and, for Basic-tier users, to show ads. See our{' '}
          <Link href="/privacy" className="text-primary underline hover:text-primary/70">Privacy Policy</Link> for details.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => respond('declined')}>Decline</Button>
          <Button variant="primary" size="sm" onClick={() => respond('accepted')}>Accept All</Button>
        </div>
      </div>
    </div>
  )
}
