import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { displayNameRegex } from '@/lib/validations/auth'

function formatGoogleDisplayName(meta: Record<string, unknown>): string | null {
  const given  = typeof meta.given_name  === 'string' ? meta.given_name.trim()  : ''
  const family = typeof meta.family_name === 'string' ? meta.family_name.trim() : ''
  if (!given || !family) return null

  // Capitalise each word, preserving spaces and hyphens (e.g. "Mary Ann", "Jean-Pierre")
  const firstName = given
    .split(' ')
    .map(part =>
      part.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-')
    )
    .join(' ')

  return `${firstName} ${family.charAt(0).toUpperCase()}.`
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
