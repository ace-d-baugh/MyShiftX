'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutGrid,
  User,
  ShieldCheck,
  Flag,
  Archive,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { UserType } from '@/lib/database.types'

interface NavbarProps {
  userRole: UserType
  displayName: string
}

const navItems = [
  { href: '/board', label: 'Board', icon: LayoutGrid, roles: ['Cast', 'CoPro', 'Leader', 'Admin'] },
  { href: '/profile', label: 'Profile', icon: User, roles: ['Cast', 'CoPro', 'Leader', 'Admin'] },
  { href: '/leader/approvals', label: 'Approvals', icon: ShieldCheck, roles: ['Leader', 'Admin'] },
  { href: '/leader/flags', label: 'Flags', icon: Flag, roles: ['Leader', 'Admin'] },
  { href: '/leader/archive', label: 'Archive', icon: Archive, roles: ['Leader', 'Admin'] },
  { href: '/admin', label: 'Admin', icon: Settings, roles: ['Admin'] },
] as const

export function Navbar({ userRole, displayName }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const visibleItems = navItems.filter(item =>
    (item.roles as readonly string[]).includes(userRole)
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      {/* Desktop top navbar */}
      <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        {/* Top bar: Logo + User/Logout */}
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between h-16">
          <Link href="/board" className="flex flex-row items-center gap-0 align-baseline">
            <h1 className="font-accent text-5xl font-bold text-primary leading-tight align-middle">WDW</h1>
            <Image
              src="/logos/ShiftX-logo.svg"
              alt="WDWShiftX Logo"
              width={120}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-text/60 font-medium">{displayName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-text/60 hover:text-warning hover:bg-warning/10 transition-colors min-h-0 min-w-0"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>

        {/* Sub-nav bar: Nav Links */}
        <div className="border-t border-border bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center justify-center gap-1 h-10">
              {visibleItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-h-0 min-w-0',
                    isActive(href)
                      ? 'bg-primary-light text-primary'
                      : 'text-text/60 hover:text-text hover:bg-primary-light/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="px-4 flex items-center justify-between h-14">
          <Link href="/board"className="flex flex-row items-center gap-0 align-baseline">
            <h1 className="font-accent text-4xl md:text-4xl font-bold text-primary leading-tight align-middle">WDW</h1>
            <Image
              src="/logos/ShiftX-logo.svg"
              alt="WDWShiftX Logo"
              width={100}
              height={32}
              priority
              className="h-7 w-auto"
            />
          </Link>          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-text/60 hover:text-text hover:bg-primary-light transition-colors min-h-0 min-w-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="bg-white border-b border-border shadow-lg">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-xs text-text/40 font-medium uppercase tracking-wide">Signed in as</p>
              <p className="text-sm font-medium text-text">{displayName}</p>
            </div>
            <nav className="py-2">
              {visibleItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                    isActive(href)
                      ? 'bg-primary-light text-primary'
                      : 'text-text/70 hover:bg-primary-light/50 hover:text-text'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-warning hover:bg-warning/10 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-pb">
        <div className="flex items-stretch">
          {visibleItems.slice(0, 5).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors min-h-[56px]',
                isActive(href)
                  ? 'text-primary bg-primary-light/50'
                  : 'text-text/50 hover:text-text'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
