import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET!

export async function GET(req: NextRequest) {
  // Verify the cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Expire shifts where expires_at <= NOW()
    const { data: shiftsData, error: shiftsError } = await supabase.rpc('expire_shifts')
    if (shiftsError) throw shiftsError

    // Expire requests where expires_at <= NOW()
    const { data: requestsData, error: requestsError } = await supabase.rpc('expire_requests')
    if (requestsError) throw requestsError

    return NextResponse.json({
      success: true,
      message: 'Expirations processed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Expiration cron error:', error)
    return NextResponse.json(
      { error: 'Failed to process expirations', details: error.message },
      { status: 500 }
    )
  }
}
