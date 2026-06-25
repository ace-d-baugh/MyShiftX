import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SessionTimeout } from '@/components/features/SessionTimeout'
import { PreferencesSyncer } from '@/components/features/PreferencesSyncer'
import type { GlobalRole } from '@/lib/database.types'

type UserProfileRow = { id: string; display_name: string | null; role: GlobalRole; is_active: boolean } | null

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  noStore()

  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Layout] user=${user?.email ?? 'none'} err=${error?.message ?? 'none'}`)
  }

  if (!user) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, display_name, role, is_active')
    .eq('id', user.id)
    .single() as unknown as { data: UserProfileRow }

  if (userProfile && !userProfile.is_active) {
    redirect('/login?reason=deactivated')
  }

  if (!userProfile || userProfile.role === 'Guest') {
    redirect('/verify-email')
  }

  const userRole = userProfile?.role ?? 'User'
  const displayName = userProfile?.display_name ?? user.email ?? 'User'
  const isAdmin = userRole === 'Admin'

  // Check if user is a board moderator (Mod or Leader of any board)
  const { data: isMod } = await supabase.rpc('is_any_board_moderator')
  const isBoardModerator = (isMod ?? false) as boolean

  let pendingApprovalsCount = 0
  let pendingFlagsCount = 0
  let isLeader = isAdmin

  if (isBoardModerator || isAdmin) {
    const [approvalsRes, flagsRes, leaderRes] = await Promise.all([
      supabase
        .from('user_boards')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', false),
      supabase
        .from('flags')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      isAdmin
        ? Promise.resolve({ count: 1 })
        : supabase
            .from('user_boards')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('role', 'Leader')
            .eq('is_approved', true),
    ])
    pendingApprovalsCount = approvalsRes.count ?? 0
    pendingFlagsCount     = flagsRes.count     ?? 0
    if (!isAdmin) isLeader = (leaderRes.count ?? 0) > 0
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SessionTimeout />
      <PreferencesSyncer />
      <Navbar
        userRole={userRole}
        displayName={displayName}
        isBoardModerator={isBoardModerator}
        isLeader={isLeader}
        pendingApprovalsCount={pendingApprovalsCount}
        pendingFlagsCount={pendingFlagsCount}
      />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
    </div>
  )
}
