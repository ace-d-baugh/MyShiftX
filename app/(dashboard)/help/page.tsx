import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { HelpClient } from './HelpClient'

export const metadata = { title: 'Help & Support – MyShiftX' }

export default async function HelpPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  return <HelpClient userEmail={profile?.email ?? user.email ?? ''} />
}
