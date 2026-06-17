'use client'

import { useEffect, useRef, useState } from 'react'
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
import type { GlobalRole } from '@/lib/database.types'

interface NavbarProps {
  userRole: GlobalRole
  displayName: string
  pendingApprovalsCount?: number
  isBoardModerator?: boolean
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  requiresMod?: boolean
  requiresAdmin?: boolean
}

const navItems: NavItem[] = [
  { href: '/wall',              label: 'The Wall',  icon: LayoutGrid  },
  { href: '/profile',           label: 'Profile',   icon: User        },
  { href: '/leader/approvals',  label: 'Approvals', icon: ShieldCheck, requiresMod: true  },
  { href: '/leader/flags',      label: 'Flags',     icon: Flag,        requiresMod: true  },
  { href: '/leader/archive',    label: 'Archive',   icon: Archive,     requiresMod: true  },
  { href: '/admin',             label: 'Admin',     icon: Settings,    requiresAdmin: true },
]

export function Navbar({ userRole, displayName, pendingApprovalsCount = 0, isBoardModerator = false }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setDarkMode(getStoredTheme() === 'dark')
  }, [])

  const isAdmin = userRole === 'Admin'

  const visibleItems = navItems.filter(item => {
    if (item.requiresAdmin) return isAdmin
    if (item.requiresMod)   return isBoardModerator || isAdmin
    return true
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    applyTheme(next ? 'dark' : 'light')
  }

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openMobileMenu = () => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null }
    setMobileMenuOpen(true)
    setMobileMenuClosing(false)
  }
  const closeMobileMenu = () => {
    if (mobileMenuClosing) return
    setMobileMenuClosing(true)
    closeTimerRef.current = setTimeout(() => {
      setMobileMenuOpen(false)
      setMobileMenuClosing(false)
      closeTimerRef.current = null
    }, 200)
  }
  const toggleMobileMenu = () => mobileMenuOpen && !mobileMenuClosing ? closeMobileMenu() : openMobileMenu()

  const isActive = (href: string) => pathname.startsWith(href)
  const approvalsBadgeCount = pendingApprovalsCount > 9 ? '9+' : pendingApprovalsCount

  return (
    <>
      {/* Desktop top navbar */}
      <header className="hidden md:block sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        {/* Top bar: Logo + User/Logout */}
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between h-16">
          <Link href="/wall" className="flex flex-row items-center gap-0 align-baseline">
            <h1 className="font-accent text-5xl font-bold text-primary leading-tight align-middle">My</h1>
            <Image
              src="/logos/ShiftX-logo.svg"
              alt="MyShiftX Logo"
              width={1560}
              height={500}
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
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-h-0 min-w-0',
                    isActive(href)
                      ? 'bg-primary-light text-primary'
                      : 'text-text/60 hover:text-text hover:bg-primary-light/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {href === '/leader/approvals' && pendingApprovalsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-warning text-white text-[10px] font-bold leading-none">
                      {approvalsBadgeCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="px-4 flex items-center justify-between h-14">
          <Link href="/wall" className="flex flex-row items-center gap-0 align-baseline">
            <h1 className="font-accent text-4xl md:text-4xl font-bold text-primary leading-tight align-middle">My</h1>
            <Image
              src="/logos/ShiftX-logo.svg"
              alt="MyShiftX Logo"
              width={1560}
              height={500}
              priority
              className="h-7 w-auto"
            />
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-text/60 hover:text-text hover:bg-primary-light transition-colors min-h-0 min-w-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen && !mobileMenuClosing ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div
            className="bg-card border-b border-border shadow-lg"
            style={{ animation: mobileMenuClosing ? 'navMenuClose 0.18s ease-in both' : 'navMenuOpen 0.38s ease-out both' }}
          >
            <div className="px-4 py-2 border-b border-border">
              <p className="text-xs text-text/40 font-medium uppercase tracking-wide">Signed in as</p>
              <p className="text-sm font-medium text-text">{displayName}</p>
            </div>
            <nav className="py-2">
              {visibleItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                    isActive(href)
                      ? 'bg-primary-light text-primary'
                      : 'text-text/70 hover:bg-primary-light/50 hover:text-text'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {href === '/leader/approvals' && pendingApprovalsCount > 0 && (
                    <span className="ml-auto flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-warning text-white text-xs font-bold leading-none">
                      {approvalsBadgeCount}
                    </span>
                  )}
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
              <span className="relative">
                <Icon className="w-5 h-5" />
                {href === '/leader/approvals' && pendingApprovalsCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[1rem] h-4 px-1 rounded-full bg-warning text-white text-[9px] font-bold leading-none">
                    {approvalsBadgeCount}
                  </span>
                )}
              </span>
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
