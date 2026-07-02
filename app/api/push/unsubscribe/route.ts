import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  endpoint: z.string().url().max(1024),
})

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid endpoint.' }, { status: 400 })
  }

  // RLS restricts the delete to the caller's own rows
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', parsed.data.endpoint)

  if (error) {
    console.error('[push/unsubscribe] delete error:', error.message)
    return NextResponse.json({ error: 'Could not remove subscription.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
