import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminClient } from './AdminClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Admin – MyShiftX' }

export default async function AdminPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users').select('role').eq('id', user.id).single()

  if (!userProfile || userProfile.role !== 'Admin') redirect('/wall')

  const [boardsRes, usersRes] = await Promise.all([
    supabase
      .from('boards')
      .select('id, name, invite_code_enabled, is_active, created_at')
      .order('name')
      .limit(200),
    supabase
      .from('users')
      .select('id, display_name, role, is_active, created_at')
      .order('display_name')
      .limit(200),
  ])

  return (
    <AdminClient
      boards={(boardsRes.data ?? []) as { id: string; name: string; invite_code_enabled: boolean; is_active: boolean; created_at: string }[]}
      users={(usersRes.data ?? []) as { id: string; display_name: string; role: string; is_active: boolean; created_at: string }[]}
      adminId={user.id}
    />
  )
}
