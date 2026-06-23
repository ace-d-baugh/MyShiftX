'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, LayoutGrid, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface LandingHeaderProps {
  displayName: string | null
}

export function LandingHeader({ displayName }: LandingHeaderProps) {
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const isLoggedIn = !!displayName

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border animate-slide-down">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={isLoggedIn ? '/wall' : '/'} className="flex flex-row items-center gap-0 align-baseline">
          <Image
            src="/logos/ShiftX-logo.svg"
            alt="MyShiftX Logo"
            width={1560}
            height={500}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-text/70 hover:text-text hover:bg-primary-light/50 transition-colors min-h-0 min-w-0"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="font-medium">{displayName}</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-xl z-50 py-1.5 overflow-hidden"
                  >
                    <Link
                      href="/wall"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text/80 hover:bg-primary-light/50 hover:text-text transition-colors"
                    >
                      <LayoutGrid className="w-4 h-4" /> The Wall
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text/80 hover:bg-primary-light/50 hover:text-text transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-warning hover:bg-warning/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline text-sm px-4 py-2 min-h-0 h-10">
                Log In
              </Link>
              <Link href="/register" className="btn btn-primary text-sm px-4 py-2 min-h-0 h-10">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
