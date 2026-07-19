import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { optionalServerEnv } from '@/lib/env'

export async function GET(req: NextRequest) {
  // Verify the cron is configured before doing anything else
  if (!optionalServerEnv.CRON_SECRET || !optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${optionalServerEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    // Expire shifts where expires_at <= NOW()
    const { error: shiftsError } = await supabase.rpc('expire_shifts')
    if (shiftsError) throw shiftsError

    // Expire requests where expires_at <= NOW()
    const { error: requestsError } = await supabase.rpc('expire_requests')
    if (requestsError) throw requestsError

    // Downgrade Trial members whose trial period has ended
    const { error: trialError } = await supabase
      .from('users')
      .update({ membership: 'Basic', trial_ends_at: null })
      .eq('membership', 'Trial')
      .lte('trial_ends_at', new Date().toISOString())
    if (trialError) throw trialError

    return NextResponse.json({
      success: true,
      message: 'Expirations processed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    console.error('Expiration cron error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to process expirations', details: message },
      { status: 500 }
    )
  }
}
