import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { UserEditClient } from './UserEditClient'
import type { UserType } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Edit User – WDWShiftX' }

interface PageProps {
  params: { id: string }
}

export default async function AdminUserEditPage({ params }: PageProps) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single() as unknown as { data: { user_type: UserType } | null }

  if (!adminProfile || adminProfile.user_type !== 'Admin') redirect('/board')

  const { data: editUser } = await supabase
    .from('users')
    .select(`
      id, display_name, email, user_type, is_active, created_at,
      user_proficiencies (
        roles ( name ),
        properties ( name ),
        locations ( name )
      )
    `)
    .eq('id', params.id)
    .single() as unknown as { data: {
      id: string
      display_name: string
      email: string
      user_type: UserType
      is_active: boolean
      created_at: string
      user_proficiencies: Array<{
        roles: { name: string } | null
        properties: { name: string } | null
        locations: { name: string } | null
      }>
    } | null }

  if (!editUser) notFound()

  const proficiencies = (editUser.user_proficiencies ?? []).map(p => ({
    role_name: p.roles?.name ?? null,
    property_name: p.properties?.name ?? null,
    location_name: p.locations?.name ?? null,
  }))

  return (
    <UserEditClient
      user={{
        id: editUser.id,
        display_name: editUser.display_name,
        email: editUser.email,
        user_type: editUser.user_type,
        is_active: editUser.is_active,
        created_at: editUser.created_at,
        proficiencies,
      }}
      adminId={user.id}
    />
  )
}
