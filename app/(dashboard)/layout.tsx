import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { UserType } from '@/lib/database.types'

type UserProfileRow = { id: string; display_name: string; user_type: UserType; is_active: boolean } | null

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Prevent the client router from caching this layout's RSC response.
  // Without this, a redirect() thrown here gets cached and causes an
  // infinite HandleRedirect loop in the browser.
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
    .select('id, display_name, user_type, is_active')
    .eq('id', user.id)
    .single() as unknown as { data: UserProfileRow }

  if (userProfile && !userProfile.is_active) {
    redirect('/login?reason=deactivated')
  }

  if (!userProfile || userProfile.user_type === 'Guest') {
    redirect('/verify-email')
  }

  const userRole = userProfile?.user_type ?? 'Cast'
  const displayName = userProfile?.display_name ?? user.email ?? 'Cast Member'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar userRole={userRole} displayName={displayName} />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
    </div>
  )
}
