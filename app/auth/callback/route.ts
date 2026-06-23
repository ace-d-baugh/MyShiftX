import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { displayNameRegex } from '@/lib/validations/auth'

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
          .select('display_name')
          .eq('id', user.id)
          .single()

        // New OAuth users won't have a valid display name yet — send them to profile first
        const hasName = !!(
          profile?.display_name &&
          profile.display_name !== 'User' &&
          displayNameRegex.test(profile.display_name)
        )

        return NextResponse.redirect(hasName ? `${origin}/wall` : `${origin}/profile?oauth=1`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
