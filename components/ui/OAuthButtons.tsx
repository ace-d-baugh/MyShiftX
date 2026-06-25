'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Provider = 'google' | 'facebook' | 'linkedin_oidc'

// Set to true once each provider's app credentials are configured in Supabase
const ENABLED: Record<Provider, boolean> = {
  google:        true,
  facebook:      true,
  linkedin_oidc: false,   // configure LinkedIn app first
}

const PROVIDERS: { id: Provider; label: string; icon: React.ReactNode }[] = [
  {
    id: 'google',
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="#1877F2" d="M24 12.073C24 5.41 18.627 0 12 0S0 5.41 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.955.93-1.955 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'linkedin_oidc',
    label: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
]

interface OAuthButtonsProps {
  mode: 'login' | 'register'
}

export function OAuthButtons({ mode }: OAuthButtonsProps) {
  const supabase = createClient()
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enabledProviders = PROVIDERS.filter(({ id }) => ENABLED[id])
  if (enabledProviders.length === 0) return null

  const handleOAuth = async (provider: Provider) => {
    setError(null)
    setLoadingProvider(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoadingProvider(null)
    }
    // On success the browser redirects — no cleanup needed
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text/40 font-medium uppercase tracking-wide shrink-0">
          or {mode === 'login' ? 'log in' : 'sign up'} with
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {error && (
        <p className="text-xs text-warning text-center">{error}</p>
      )}

      <div className={`grid gap-2 ${Object.values(ENABLED).filter(Boolean).length === 1 ? 'grid-cols-1' : Object.values(ENABLED).filter(Boolean).length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {enabledProviders.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleOAuth(id)}
            disabled={loadingProvider !== null}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-border bg-card hover:bg-primary-light/30 transition-colors text-sm font-medium text-text disabled:opacity-50 disabled:cursor-not-allowed min-h-0"
            aria-label={`${mode === 'login' ? 'Log in' : 'Sign up'} with ${label}`}
          >
            {loadingProvider === id ? (
              <span className="w-4 h-4 border-2 border-text/30 border-t-primary rounded-full animate-spin" />
            ) : (
              icon
            )}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
