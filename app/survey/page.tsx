import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isSurveyClosed } from '@/lib/beta-schedule'
import { SurveyClient } from './SurveyClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Beta Survey – MyShiftX' }

export default async function SurveyPage() {
  if (isSurveyClosed()) redirect('/beta-test-closed')

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Personalizes the greeting only — never submitted with the survey data,
  // and the survey itself is fully anonymous (see app/actions/survey.ts).
  let displayName = 'there'
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single()
    displayName = profile?.display_name ?? 'there'
  }

  return <SurveyClient displayName={displayName} />
}
