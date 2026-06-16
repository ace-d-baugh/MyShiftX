import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ApprovalsClient } from './ApprovalsClient'
import type { UserType } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Approvals – WDWShiftX' }

type ProfileRow = { user_type: UserType } | null

export default async function ApprovalsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users').select('user_type').eq('id', user.id).single() as unknown as { data: ProfileRow }

  if (!userProfile || !(['Mod', 'Leader', 'Admin'] as UserType[]).includes(userProfile.user_type)) {
    redirect('/board')
  }

  const { data: pendingLocations } = await supabase
    .from('locations')
    .select('id, name, property_id, created_at, properties(name), users!suggested_by_user_id(display_name)')
    .eq('is_approved', false)
    .order('created_at', { ascending: true })

  const { data: pendingRoles } = await supabase
    .from('roles')
    .select('id, name, created_at, users!suggested_by_user_id(display_name)')
    .eq('is_approved', false)
    .order('created_at', { ascending: true })

  const { data: pendingProficiencies } = await supabase
    .from('user_proficiencies')
    .select('id, role_id, location_id, created_at, roles(name), properties(name), locations(name), users!user_id(display_name)')
    .eq('is_approved', false)
    .order('created_at', { ascending: true })

  return (
    <ApprovalsClient
      pendingLocations={(pendingLocations ?? []) as { id: string; name: string; property_id: string; created_at: string; properties: { name: string } | null; users: { display_name: string } | null }[]}
      pendingRoles={(pendingRoles ?? []) as { id: string; name: string; created_at: string; users: { display_name: string } | null }[]}
      pendingProficiencies={(pendingProficiencies ?? []) as { id: string; role_id: string; location_id: string; created_at: string; roles: { name: string } | null; properties: { name: string } | null; locations: { name: string } | null; users: { display_name: string } | null }[]}
      approverId={user.id}
      userRole={userProfile.user_type}
    />
  )
}
