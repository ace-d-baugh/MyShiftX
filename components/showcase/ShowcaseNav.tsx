import Link from 'next/link'
import { LayoutGrid, CalendarDays, MessageSquare } from 'lucide-react'
import { ThemedLogo } from '@/components/ui/ThemedLogo'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/wall', label: 'The Wall', icon: LayoutGrid },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
] as const

/**
 * The demo's own header. Mirrors the signed-in Navbar's tab strip so the
 * preview reads as the real app, minus every control that would need a
 * session (account menu, notifications, post buttons).
 */
export function ShowcaseNav({ active }: { active: '/wall' | '/calendar' | '/messages' }) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="shrink-0" aria-label="MyShiftX home">
            <ThemedLogo className="h-8 w-auto" />
          </Link>
          <nav className="flex items-center gap-1" aria-label="Demo sections">
            {TABS.map(tab => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active === tab.href ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active === tab.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-text/60 hover:text-text hover:bg-primary-light/50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            ))}
          </nav>
          <Link
            href="/blog"
            className="hidden md:inline-flex text-sm font-medium text-text/60 hover:text-primary transition-colors"
          >
            Blog
          </Link>
        </div>
      </div>
    </header>
  )
}
