import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { BoardClient } from './BoardClient'
import type { UserType } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Shift Board – WDWShiftX',
}

type UserProfileRow = { id: string; display_name: string; user_type: UserType } | null

interface ProficiencyRow {
  role_id: string
  location_id: string
  property_id: string
  roles: { id: string; name: string } | null
  locations: { id: string; name: string; property_id: string } | null
  properties: { id: string; name: string } | null
}

export default async function BoardPage() {
  noStore()

  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (process.env.NODE_ENV === 'development') {
    console.log(`[BoardPage] user=${user?.email ?? 'none'} err=${error?.message ?? 'none'}`)
  }

  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, display_name, user_type')
    .eq('id', user.id)
    .single() as unknown as { data: UserProfileRow }

  const isAdmin = userProfile?.user_type === 'Admin'

  // Admins see everything — fetch global lists instead of proficiencies
  if (isAdmin) {
    const [propertiesRes, locationsRes, rolesRes] = await Promise.all([
      supabase.from('properties').select('id, name').order('name'),
      supabase.from('locations').select('id, name, property_id').eq('is_approved', true).order('name'),
      supabase.from('roles').select('id, name').eq('is_approved', true).order('name'),
    ])

    return (
      <BoardClient
        userId={user.id}
        displayName={userProfile?.display_name ?? 'Admin'}
        userRole="Admin"
        isAdmin={true}
        uniqueRoles={(rolesRes.data ?? []) as { id: string; name: string }[]}
        uniqueProperties={(propertiesRes.data ?? []) as { id: string; name: string }[]}
        uniqueLocations={(locationsRes.data ?? []) as { id: string; name: string; property_id: string }[]}
        proficiencyEntries={[]}
        hasProficiencies={true}
      />
    )
  }

  // All other types — board is scoped to their proficiencies
  const { data: proficiencyRows } = await supabase
    .from('user_proficiencies')
    .select(`
      role_id,
      location_id,
      property_id,
      roles(id, name),
      locations(id, name, property_id),
      properties(id, name)
    `)
    .eq('user_id', user.id)
    .eq('is_approved', true) as unknown as { data: ProficiencyRow[] | null }

  const rows = proficiencyRows ?? []

  const roleMap = new Map<string, { id: string; name: string }>()
  const propertyMap = new Map<string, { id: string; name: string }>()
  const locationMap = new Map<string, { id: string; name: string; property_id: string }>()

  for (const row of rows) {
    if (row.roles) roleMap.set(row.roles.id, row.roles)
    if (row.properties) propertyMap.set(row.properties.id, row.properties)
    if (row.locations) locationMap.set(row.locations.id, { ...row.locations, property_id: row.property_id })
  }

  const uniqueRoles = [...roleMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  const uniqueProperties = [...propertyMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  const uniqueLocations = [...locationMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  const proficiencyEntries = rows.map(r => ({ role_id: r.role_id, location_id: r.location_id, property_id: r.property_id }))

  return (
    <BoardClient
      userId={user.id}
      displayName={userProfile?.display_name ?? 'Cast Member'}
      userRole={userProfile?.user_type ?? 'Cast'}
      isAdmin={false}
      uniqueRoles={uniqueRoles}
      uniqueProperties={uniqueProperties}
      uniqueLocations={uniqueLocations}
      proficiencyEntries={proficiencyEntries}
      hasProficiencies={rows.length > 0}
    />
  )
}
