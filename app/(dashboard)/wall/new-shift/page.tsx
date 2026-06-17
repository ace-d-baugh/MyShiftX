import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { PostShiftForm } from '@/components/features/PostShiftForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Post a Shift – MyShiftX',
}

export default async function NewShiftPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/wall" className="inline-flex items-center gap-1.5 text-sm text-text/60 hover:text-text mb-6 min-h-0 min-w-0">
        <ArrowLeft className="w-4 h-4" /> Back to The Wall
      </Link>
      <div className="mb-6">
        <h1 className="font-accent text-2xl font-bold text-text">Post a Shift</h1>
        <p className="text-sm text-text/60">Offer your shift for trade or giveaway</p>
      </div>
      <div className="card shadow-sm">
        <PostShiftForm
          userId={user.id}
          displayName={userProfile?.display_name ?? 'User'}
        />
      </div>
    </div>
  )
}
