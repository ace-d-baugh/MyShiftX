import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { checkExistingSubmission } from '@/app/actions/survey'
import { SurveyClient } from './SurveyClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Beta Survey – MyShiftX' }

export default async function SurveyPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const alreadySubmitted = await checkExistingSubmission()

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <SurveyClient
      displayName={profile?.display_name ?? 'there'}
      alreadySubmitted={alreadySubmitted}
    />
  )
}
