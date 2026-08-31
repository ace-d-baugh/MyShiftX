'use client'

import { useEffect } from 'react'

/**
 * Next's client-side router doesn't reliably scroll to an in-page anchor on
 * navigation (e.g. the footer's "Your Privacy Choices" link to
 * /privacy#your-privacy-choices lands at the top of the page, indistinguishable
 * from the plain "Privacy" link). Retry scrollIntoView for a couple seconds so
 * it still lands correctly even if the target shifts after mount (ad slots,
 * images).
 */
export function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return

    let attempts = 0
    const id = setInterval(() => {
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ block: 'start' })
      if (++attempts >= 10) clearInterval(id)
    }, 200)

    return () => clearInterval(id)
  }, [])

  return null
}
