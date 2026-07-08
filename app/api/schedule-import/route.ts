import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { optionalServerEnv } from '@/lib/env'

// CPU-only inference on the VPS routinely takes 2-5 minutes per image
// (measured against real schedule photos, not just the small test cases the
// 30-90s estimate was based on) — well past the default function timeout.
// Requires Vercel Pro; 290s leaves a small margin under Pro's 300s hard cap.
export const maxDuration = 290

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const DEFAULT_MODEL = 'qwen2.5vl:3b'

// Structured-output schema passed to Ollama — constrains generation so the
// model can only emit this shape (no prose, no markdown fences).
const OLLAMA_FORMAT = {
  type: 'object',
  properties: {
    shifts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date:       { type: 'string' },
          start_time: { type: 'string' },
          end_time:   { type: 'string' },
          title:      { type: 'string' },
        },
        required: ['date', 'start_time', 'end_time'],
      },
    },
  },
  required: ['shifts'],
} as const

const parsedShiftSchema = z.object({
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time:   z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  title:      z.string().trim().max(35).optional(),
})

function buildPrompt(): string {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  return `You are reading a photo of a work schedule. Today's date is ${today}.
Extract every work shift shown in the image.

Rules:
- "date" must be YYYY-MM-DD. If the schedule shows no year, use the nearest occurrence on or after today's date.
- "start_time" and "end_time" must be 24-hour HH:MM. Convert AM/PM times (e.g. "3:15 PM" -> "15:15").
- "title" is the role, position, or location text shown for that shift, if any (keep it under 35 characters).
- Skip days marked off, vacation, or with no shift. Skip entries with a missing or unreadable time.
- If the image contains no readable schedule, return an empty shifts array.`
}

export async function POST(req: NextRequest) {
  const { VPS_OLLAMA_URL, VPS_OLLAMA_SECRET } = optionalServerEnv
  if (!VPS_OLLAMA_URL || !VPS_OLLAMA_SECRET) {
    return NextResponse.json({ error: 'Schedule import is not configured yet.' }, { status: 503 })
  }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Quota check up front so a Basic user over the limit never triggers a
  // (slow, CPU-bound) model run. Consumption happens after a successful
  // parse so a VPS failure doesn't burn an import.
  const { data: statusRows, error: statusErr } = await supabase.rpc('get_schedule_import_status')
  const status = statusRows?.[0]
  if (statusErr || !status) {
    return NextResponse.json({ error: 'Could not verify your import quota. Please try again.' }, { status: 500 })
  }
  if (status.import_limit >= 0 && status.used >= status.import_limit) {
    return NextResponse.json(
      { error: `You've used all ${status.import_limit} schedule imports for this month. Upgrade to Pro for unlimited imports.` },
      { status: 403 }
    )
  }

  let file: File | null = null
  try {
    const form = await req.formData()
    const entry = form.get('image')
    if (entry instanceof File) file = entry
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: 'No image provided.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Please upload a JPEG, PNG, or WebP image.' }, { status: 400 })
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image is too large (8 MB max).' }, { status: 400 })
  }

  const imageB64 = Buffer.from(await file.arrayBuffer()).toString('base64')
  const model = optionalServerEnv.OLLAMA_VISION_MODEL ?? DEFAULT_MODEL

  let content: string
  try {
    const res = await fetch(`${VPS_OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${VPS_OLLAMA_SECRET}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: 'user', content: buildPrompt(), images: [imageB64] }],
        format: OLLAMA_FORMAT,
        options: { temperature: 0 },
        // Keep the model resident between imports so only the first request
        // of the day pays the multi-minute model load.
        keep_alive: '60m',
      }),
      // Leaves ~10s of the 290s function budget for the JSON parse/quota RPC
      // that happen after this resolves.
      signal: AbortSignal.timeout(280_000),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[schedule-import] Ollama HTTP ${res.status}:`, detail.slice(0, 500))
      return NextResponse.json({ error: 'The schedule reader is unavailable right now. Please try again in a minute.' }, { status: 502 })
    }
    const json = await res.json() as { message?: { content?: string } }
    content = json.message?.content ?? ''
  } catch (err) {
    console.error('[schedule-import] Ollama request failed:', err)
    const timedOut = err instanceof Error && err.name === 'TimeoutError'
    return NextResponse.json(
      { error: timedOut ? 'Reading the schedule took too long. Try a clearer or smaller photo.' : 'Could not reach the schedule reader. Please try again.' },
      { status: 502 }
    )
  }

  let shifts: z.infer<typeof parsedShiftSchema>[]
  try {
    const parsed = JSON.parse(content) as { shifts?: unknown[] }
    shifts = (parsed.shifts ?? [])
      .map(s => parsedShiftSchema.safeParse(s))
      .filter((r): r is { success: true; data: z.infer<typeof parsedShiftSchema> } => r.success)
      .map(r => r.data)
  } catch {
    console.error('[schedule-import] model returned unparseable content:', content.slice(0, 500))
    return NextResponse.json({ error: 'Could not read a schedule from that photo. Try a clearer, well-lit shot.' }, { status: 422 })
  }

  if (shifts.length === 0) {
    // A readable photo with no shifts shouldn't cost an import.
    return NextResponse.json({ shifts: [], remaining: remainingFrom(status.used, status.import_limit) })
  }

  // Consume quota only after a successful parse.
  const { data: newUsed } = await supabase.rpc('consume_schedule_import')
  const used = typeof newUsed === 'number' && newUsed >= 0 ? newUsed : status.used + 1

  return NextResponse.json({
    shifts,
    remaining: remainingFrom(used, status.import_limit),
  })
}

/** -1 = unlimited */
function remainingFrom(used: number, limit: number): number {
  return limit < 0 ? -1 : Math.max(0, limit - used)
}
