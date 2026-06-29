import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { SurveyClient } from './SurveyClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Beta Survey – MyShiftX' }

export default async function SurveyPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('beta_survey_responses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <SurveyClient
      displayName={profile?.display_name ?? 'there'}
      alreadySubmitted={!!existing}
    />
  )
}
