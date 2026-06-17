import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { WallClient } from './WallClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The Wall – MyShiftX',
}

interface Board { id: string; name: string }

export default async function WallPage() {
  noStore()

  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (process.env.NODE_ENV === 'development') {
    console.log(`[WallPage] user=${user?.email ?? 'none'} err=${error?.message ?? 'none'}`)
  }

  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', user.id)
    .single()

  // Fetch user's approved boards for the filter dropdown
  const { data: memberRows } = await supabase
    .from('user_boards')
    .select('board_id, boards(id, name)')
    .eq('user_id', user.id)
    .eq('is_approved', true)

  const boards = (memberRows ?? [])
    .map((ub: { board_id: string; boards: Board | null }) => ub.boards)
    .filter((b): b is Board => !!b)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <WallClient
      userId={user.id}
      displayName={userProfile?.display_name ?? 'User'}
      boards={boards}
      hasBoards={boards.length > 0}
    />
  )
}
