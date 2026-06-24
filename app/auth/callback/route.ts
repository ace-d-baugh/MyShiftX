import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { displayNameRegex } from '@/lib/validations/auth'

function formatGoogleDisplayName(meta: Record<string, unknown>): string | null {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  let firstPart = ''
  let lastInitial = ''

  const given  = str(meta.given_name)
  const family = str(meta.family_name)

  if (given && family) {
    firstPart   = given
    lastInitial = family.charAt(0).toUpperCase()
  } else {
    // Fall back to full_name or name ("Tyrell Erfunden" → "Tyrell" + "E")
    const full = str(meta.full_name) || str(meta.name)
    if (!full) return null
    const lastSpace = full.lastIndexOf(' ')
    if (lastSpace === -1) return null
    firstPart   = full.slice(0, lastSpace)
    lastInitial = full.charAt(lastSpace + 1).toUpperCase()
  }

  if (!firstPart || !lastInitial) return null

  // Capitalise each word, preserving hyphens (e.g. "Mary Ann", "Jean-Pierre")
  const formattedFirst = firstPart
    .split(' ')
    .map(part =>
      part.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-')
    )
    .join(' ')

  return `${formattedFirst} ${lastInitial}.`
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('display_name, email')
          .eq('id', user.id)
          .single()

        let hasName = !!(
          profile?.display_name &&
          profile.display_name !== 'User' &&
          displayNameRegex.test(profile.display_name)
        )

        // If no valid display name yet, try to derive one from Google metadata
        if (!hasName && user.app_metadata?.provider === 'google') {
          const meta = (user.user_metadata ?? {}) as Record<string, unknown>
          const derived = formatGoogleDisplayName(meta)

          if (derived && displayNameRegex.test(derived)) {
            // Upsert so this works for both new and existing users
            await supabase.from('users').upsert({
              id: user.id,
              email: user.email ?? profile?.email ?? '',
              display_name: derived,
              email_verified: true,
              role: 'Guest',
              is_active: true,
            }, { onConflict: 'id' })

            hasName = true
          }
        }

        return NextResponse.redirect(hasName ? `${origin}/wall` : `${origin}/profile?oauth=1`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
