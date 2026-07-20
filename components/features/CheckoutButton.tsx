'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CheckoutButtonProps {
  /** Plan key from lib/pricing.ts — the server resolves it to a Stripe Price ID. */
  planKey: string
  label: string
  featured?: boolean
  /** Not logged in: send to login and come back to /upgrade afterwards. */
  loggedIn: boolean
}

/**
 * Sends the user to Stripe Checkout for one plan (Task 7). Deliberately posts
 * only the plan key — price IDs stay server-side so a tampered request can't
 * check out against an arbitrary price.
 */
export function CheckoutButton({ planKey, label, featured, loggedIn }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    if (!loggedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent('/upgrade')}`
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not start checkout.')
        setLoading(false)
        return
      }
      // Full navigation, not router.push — Stripe Checkout is off-origin.
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={go}
        disabled={loading}
        className={`btn w-full gap-2 ${featured ? 'btn-primary' : 'btn-outline'} ${
          loading ? 'opacity-70 cursor-wait' : ''
        }`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {loading ? 'Starting…' : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-warning text-center">
          {error}
        </p>
      )}
    </div>
  )
}
