import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminClient } from './AdminClient'
import type { UserType } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Admin – WDWShiftX' }

type ProfileRow = { user_type: UserType } | null

export default async function AdminPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users').select('user_type').eq('id', user.id).single() as unknown as { data: ProfileRow }

  if (!userProfile || userProfile.user_type !== 'Admin') {
    redirect('/board')
  }

  const [propertiesRes, locationsRes, rolesRes, usersRes] = await Promise.all([
    supabase.from('properties').select('id, name, created_at').order('name'),
    supabase.from('locations').select('id, name, property_id, is_approved, created_at, properties(name)').order('name'),
    supabase.from('roles').select('id, name, is_approved, created_at').order('name'),
    supabase.from('users').select(`
      id, display_name, user_type, is_active, created_at,
      user_proficiencies (
        role_id, property_id, location_id,
        roles ( id, name ),
        properties ( id, name ),
        locations ( id, name )
      )
    `).order('display_name').limit(200),
  ])

  return (
    <AdminClient
      properties={(propertiesRes.data ?? []) as { id: string; name: string; created_at: string }[]}
      locations={(locationsRes.data ?? []) as { id: string; name: string; property_id: string; is_approved: boolean; created_at: string; properties: { name: string } | null }[]}
      roles={(rolesRes.data ?? []) as { id: string; name: string; is_approved: boolean; created_at: string }[]}
      users={(usersRes.data ?? []) as any}
      adminId={user.id}
      currentUserType={userProfile.user_type}
    />
  )
}
