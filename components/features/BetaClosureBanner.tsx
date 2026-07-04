'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'

const STORAGE_KEY = 'myshiftx-beta-closure-dismissed'

/**
 * One-time notice on the Wall that beta testing is ending and the site is
 * going offline temporarily. Dismissal is remembered per device, same
 * pattern as PushPromptBanner — the full explanation lives on /beta-test.
 */
export function BetaClosureBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return
    } catch {}
    setVisible(true)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    setVisible(false)
  }

  return (
    <div className="mb-5 p-3.5 rounded-lg bg-warning/10 border border-warning/20 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-text/80 flex-1">
          Beta testing is wrapping up. MyShiftX will go dark, tonight, at <strong>11:59 PM Saturday, July 4th</strong> while
          we process feedback — sorry for the inconvenience! Please{' '}
          <Link href="/survey" className="text-primary underline hover:text-primary/70">fill out the survey</Link>{' '}
          before then. To learn more, visit the{' '}
          <Link href="/beta-test" className="text-primary underline hover:text-primary/70">beta test page</Link>.
        </p>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-md text-text/40 hover:text-text hover:bg-text/5 transition-colors min-h-0 min-w-0 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
