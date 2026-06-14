import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { FlagsClient } from './FlagsClient'
import type { UserType } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Flags – WDWShiftX' }

type ProfileRow = { user_type: UserType } | null

export default async function FlagsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users').select('user_type').eq('id', user.id).single() as unknown as { data: ProfileRow }

  if (!userProfile || !(['Leader', 'Admin'] as UserType[]).includes(userProfile.user_type)) {
    redirect('/board')
  }

  const { data: flags } = await supabase
    .from('flags')
    .select('id, target_type, target_id, reason, status, created_at, users!flagged_by_user_id(display_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return <FlagsClient
    flags={(flags ?? []) as { id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string; users: { display_name: string } | null }[]}
    resolverId={user.id}
  />
}
