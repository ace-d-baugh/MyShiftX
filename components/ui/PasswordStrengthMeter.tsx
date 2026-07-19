'use client'

import { Check, X, Star } from 'lucide-react'
import { PASSWORD_REQUIREMENTS } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'

interface Tier {
  label: string
  emoji: string
  bar: string
  text: string
}

// Bar/label color + copy per tier. Keyed by how many of the 5 requirements
// are currently met — Supabase only accepts the password once all 5 are true,
// so "strong" here means "this will actually be accepted."
const TIERS: Record<'weak' | 'fair' | 'strong', Tier> = {
  weak:   { label: 'Weak — keep going',  emoji: '😬', bar: 'bg-warning',         text: 'text-warning' },
  fair:   { label: 'Getting there',      emoji: '💪', bar: 'bg-secondary-accent', text: 'text-secondary-accent' },
  strong: { label: 'Strong password',    emoji: '🎉', bar: 'bg-success',         text: 'text-success' },
}

/**
 * Live password strength feedback for registration + reset-password.
 * Every check here comes from PASSWORD_REQUIREMENTS (lib/validations/auth.ts)
 * — the same array the Zod schema validates against — so this can never show
 * "all clear" on a password the submit handler then rejects.
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null

  const results = PASSWORD_REQUIREMENTS.map(r => ({ ...r, met: r.test(password) }))
  const score = results.filter(r => r.met).length

  const tierKey = score === PASSWORD_REQUIREMENTS.length ? 'strong' : score >= 3 ? 'fair' : 'weak'
  const tier = TIERS[tierKey]

  return (
    <div className="mt-2 space-y-2 animate-fade-in-up">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300 ease-out', tier.bar)}
            style={{ width: `${(score / PASSWORD_REQUIREMENTS.length) * 100}%` }}
          />
        </div>
        <span className={cn('text-xs font-semibold shrink-0 flex items-center gap-1', tier.text)}>
          {tierKey === 'strong' && (
            <Star key="strong-star" className="w-3.5 h-3.5 animate-pop-in" fill="currentColor" strokeWidth={0} />
          )}
          {tier.label} {tier.emoji}
        </span>
      </div>

      {/* Checklist — each item mounts fresh (Check replacing X) the instant it's
          met, so animate-pop-in plays right at the moment it's satisfied. */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {results.map(r => (
          <li
            key={r.key}
            className={cn('flex items-center gap-1.5 text-xs transition-colors', r.met ? 'text-success' : 'text-text/40')}
          >
            {r.met
              ? <Check key="met" className="w-3.5 h-3.5 shrink-0 animate-pop-in" />
              : <X key="unmet" className="w-3.5 h-3.5 shrink-0" />}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
