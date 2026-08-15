import Link from 'next/link'
import Image from 'next/image'
import { SHOWCASE_MODE } from '@/lib/showcase/mode'

// Serving personalised ads counts as "sharing" for cross-context behavioural
// advertising under CPRA and the state laws that follow it, which carries an
// opt-out right. This is the quiet, permanent version of that disclosure —
// deliberately a footer link rather than an interstitial banner, and worded
// "Your Privacy Choices" rather than "Do Not Sell…", which misdescribes what
// actually happens here (we don't sell anything). Gated on the same env var as
// the ads themselves so it disappears if AdSense is ever removed.
const ADS_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID)

// Log In is dropped in showcase mode — the route still works, it's just not
// advertised, so nothing a crawler follows dead-ends at an auth wall. Blog and
// FAQ stay in both modes; they're permanent content, not part of the demo.
const LINKS = [
  { href: '/about', label: 'About' },
  { href: '/for', label: 'Industries' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  ...(ADS_CONFIGURED
    ? [{ href: '/privacy#your-privacy-choices', label: 'Your Privacy Choices' }]
    : []),
  { href: '/data-deletion', label: 'Data Deletion' },
  ...(SHOWCASE_MODE ? [] : [{ href: '/login', label: 'Log In' }]),
]

export function Footer() {
  return (
    <footer className="bg-[#2F2040] text-white/60 py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-0 align-baseline">
            <Image
              src="/logos/MyShiftX-Full-Logo-Gradient.svg"
              alt="MyShiftX"
              width={5000}
              height={1024}
              className="h-12 w-auto brightness-0 invert opacity-60"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {LINKS.map(link => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-white/10 text-xs text-center text-white/40">
          <p>
            MyShiftX is an independent platform and is not affiliated with, sponsored by,
            or endorsed by any specific employer. All trademarks are property of their
            respective owners.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} MyShiftX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
