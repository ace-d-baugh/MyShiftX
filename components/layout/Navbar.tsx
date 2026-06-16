'use client'

import { useEffect, useState } from 'react'
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
  ChevronDown,
  Moon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { applyTheme, getStoredTheme } from '@/lib/theme'
import type { UserType } from '@/lib/database.types'

interface NavbarProps {
  userRole: UserType
  displayName: string
}

const navItems = [
  { href: '/board', label: 'Board', icon: LayoutGrid, roles: ['Cast', 'Mod', 'Leader', 'Admin'] },
  { href: '/profile', label: 'Profile', icon: User, roles: ['Cast', 'Mod', 'Leader', 'Admin'] },
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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setDarkMode(getStoredTheme() === 'dark')
  }, [])

  const visibleItems = navItems.filter(item =>
    (item.roles as readonly string[]).includes(userRole)
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    applyTheme(next ? 'dark' : 'light')
  }

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      {/* Desktop top navbar */}
      <header className="hidden md:block sticky top-0 z-50 bg-card border-b border-border shadow-sm">
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

          <div className="relative">
            <button
              onClick={() => setAccountMenuOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-text/60 hover:text-text hover:bg-primary-light/50 transition-colors min-h-0 min-w-0"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
            >
              <span className="font-medium">{displayName}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', accountMenuOpen && 'rotate-180')} />
            </button>

            {accountMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 rounded-md border border-border bg-card shadow-lg z-50 py-1"
                >
                  <Link
                    href="/profile"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-text/80 hover:bg-primary-light/50 hover:text-text transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>

                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-text/80">
                    <span className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Dark Mode
                    </span>
                    <button
                      onClick={toggleDarkMode}
                      role="switch"
                      aria-checked={darkMode}
                      aria-label="Toggle dark mode"
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
                        darkMode ? 'bg-primary' : 'bg-border'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                          darkMode ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>

                  <div className="my-1 border-t border-border" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-warning hover:bg-warning/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sub-nav bar: Nav Links */}
        <div className="border-t border-border bg-card">
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
      <header className="md:hidden sticky top-0 z-50 bg-card border-b border-border shadow-sm">
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
          <div className="bg-card border-b border-border shadow-lg">
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
              <div className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-text/70 border-t border-border">
                <span className="flex items-center gap-3">
                  <Moon className="w-4 h-4" />
                  Dark Mode
                </span>
                <button
                  onClick={toggleDarkMode}
                  role="switch"
                  aria-checked={darkMode}
                  aria-label="Toggle dark mode"
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
                    darkMode ? 'bg-primary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      darkMode ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
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
