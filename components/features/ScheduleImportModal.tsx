'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, ScanLine, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Board { id: string; name: string }

interface ParsedShift {
  date: string
  start_time: string
  end_time: string
  title?: string
}

interface ImportRow {
  include: boolean
  date: string
  start: string
  end: string
  title: string
}

interface ScheduleImportModalProps {
  userId: string
  displayName: string
  open: boolean
  onClose: () => void
}

type Step = 'pick' | 'reading' | 'review' | 'saving' | 'done'

// Downscale + re-encode to JPEG before upload: keeps HEIC photos out of the
// pipeline (iOS decodes them locally), shrinks multi-MB camera shots, and
// smaller images are dramatically faster on the CPU-only VPS model.
async function toJpeg(file: File, maxDim = 1600): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not read that image. Try a JPEG or PNG photo.'))
      el.src = url
    })
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not process that image.')), 'image/jpeg', 0.85)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function ScheduleImportModal({ userId, displayName, open, onClose }: ScheduleImportModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('pick')
  const [error, setError] = useState<string | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [boardsLoading, setBoardsLoading] = useState(true)
  const [boardId, setBoardId] = useState('')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [remaining, setRemaining] = useState<number | null>(null) // -1 = unlimited
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    if (!open) return
    setStep('pick')
    setError(null)
    setRows([])
    setBoardsLoading(true)

    const load = async () => {
      const [{ data: memberRows }, { data: statusRows }] = await Promise.all([
        supabase
          .from('user_boards').select('board_id, boards(id, name)')
          .eq('user_id', userId).eq('is_approved', true),
        supabase.rpc('get_schedule_import_status'),
      ])
      const list = (memberRows ?? [])
        .map((ub: { board_id: string; boards: Board | null }) => ub.boards)
        .filter((b): b is Board => !!b)
        .sort((a, b) => a.name.localeCompare(b.name))
      setBoards(list)
      if (list.length === 1) setBoardId(list[0].id)

      const status = statusRows?.[0]
      if (status) {
        setRemaining(status.import_limit < 0 ? -1 : Math.max(0, status.import_limit - status.used))
      }
      setBoardsLoading(false)
    }
    load()
  }, [open, supabase, userId])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setStep('reading')
    try {
      const jpeg = await toJpeg(file)
      const form = new FormData()
      form.append('image', jpeg, 'schedule.jpg')

      const res = await fetch('/api/schedule-import', { method: 'POST', body: form })
      const json = await res.json() as { error?: string; shifts?: ParsedShift[]; remaining?: number }
      if (!res.ok) throw new Error(json.error ?? 'Import failed. Please try again.')

      if (typeof json.remaining === 'number') setRemaining(json.remaining)
      const parsed = json.shifts ?? []
      if (parsed.length === 0) {
        setError('No shifts were found in that photo. Try a clearer, well-lit shot of the schedule.')
        setStep('pick')
        return
      }
      setRows(parsed.map(s => ({
        include: true,
        date: s.date,
        start: s.start_time,
        end: s.end_time,
        title: (s.title ?? '').slice(0, 35),
      })))
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.')
      setStep('pick')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const setRow = (i: number, patch: Partial<ImportRow>) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))

  const included = rows.filter(r => r.include && r.date && r.start && r.end)

  const handleSave = async () => {
    if (!boardId || included.length === 0) return
    setError(null)
    setStep('saving')
    try {
      const inserts = included.map(r => {
        const start = new Date(`${r.date}T${r.start}`)
        const end = new Date(`${r.date}T${r.end}`)
        // An end time at or before the start means the shift runs past
        // midnight (common for closing/late shifts) — roll end to next day.
        if (end <= start) end.setDate(end.getDate() + 1)
        return {
          created_by: displayName,
          user_id: userId,
          board_id: boardId,
          shift_title: r.title.trim() || 'Shift',
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          is_trade: false,
          is_giveaway: false,
          is_overtime_approved: false,
          details: null,
          is_active: true,
        }
      })
      const { error: insertErr } = await supabase.from('shifts').insert(inserts)
      if (insertErr) throw insertErr
      setSavedCount(inserts.length)
      setStep('done')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shifts.')
      setStep('review')
    }
  }

  const quotaExhausted = remaining === 0

  return (
    <Modal open={open} onClose={onClose} title="Import Schedule from Photo" size="lg">
      {error && (
        <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">
          {error}
        </div>
      )}

      {!boardsLoading && boards.length === 0 && (
        <div className="py-8 text-center text-sm text-text/60">
          You haven&apos;t joined any boards yet.{' '}
          <a href="/profile" className="text-primary underline">Join or create a board</a> first.
        </div>
      )}

      {(boardsLoading || boards.length > 0) && step === 'pick' && (
        <div className="space-y-4">
          <p className="text-sm text-text/70">
            Take a photo of your printed or on-screen schedule and MyShiftX will read
            the shifts for you. You&apos;ll review everything before it&apos;s saved.
          </p>
          {remaining !== null && remaining >= 0 && (
            <p className="text-xs text-text/50">
              {remaining} of 4 free imports left this month.
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={quotaExhausted}
            className="w-full gap-2"
          >
            <Camera className="w-4 h-4" /> Choose or Take a Photo
          </Button>
          {quotaExhausted && (
            <p className="text-xs text-warning">
              You&apos;ve used all 4 imports this month. Upgrade to Pro for unlimited imports.
            </p>
          )}
        </div>
      )}

      {step === 'reading' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <LoadingSpinner />
          <p className="text-sm text-text/70 flex items-center gap-1.5">
            <ScanLine className="w-4 h-4 text-primary" /> Reading your schedule…
          </p>
          <p className="text-xs text-text/40">This can take up to a minute.</p>
        </div>
      )}

      {(step === 'review' || step === 'saving') && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text/60 mb-1">Add these shifts to board</label>
            <select className="input text-sm h-9" value={boardId} onChange={e => setBoardId(e.target.value)}>
              <option value="">Select a board…</option>
              {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text/50 border-b border-border">
                  <th className="px-2 py-2 w-8"><span className="sr-only">Include</span></th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Start</th>
                  <th className="px-2 py-2">End</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2 w-8"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${r.include ? '' : 'opacity-40'}`}>
                    <td className="px-2 py-1.5">
                      <Checkbox checked={r.include} onChange={e => setRow(i, { include: e.target.checked })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="date" className="input text-xs h-8 min-w-[8.5rem]" value={r.date}
                        onChange={e => setRow(i, { date: e.target.value })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="time" className="input text-xs h-8 min-w-[6rem]" value={r.start}
                        onChange={e => setRow(i, { start: e.target.value })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="time" className="input text-xs h-8 min-w-[6rem]" value={r.end}
                        onChange={e => setRow(i, { end: e.target.value })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" className="input text-xs h-8 min-w-[7rem]" value={r.title} maxLength={35}
                        placeholder="Shift" onChange={e => setRow(i, { title: e.target.value })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1 text-text/30 hover:text-warning min-h-0 min-w-0"
                        aria-label="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-text/40">
            Shifts ending at or before their start time are saved as overnight shifts (ending the next day).
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={step === 'saving'}>Cancel</Button>
            <Button
              size="sm"
              loading={step === 'saving'}
              disabled={!boardId || included.length === 0}
              onClick={handleSave}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" /> Add {included.length} Shift{included.length === 1 ? '' : 's'} to Calendar
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-success" />
          </div>
          <p className="text-sm text-text">
            Added {savedCount} shift{savedCount === 1 ? '' : 's'} to your calendar.
          </p>
          {remaining !== null && remaining >= 0 && (
            <p className="text-xs text-text/50">{remaining} of 4 free imports left this month.</p>
          )}
          <Button size="sm" onClick={onClose}>Done</Button>
        </div>
      )}
    </Modal>
  )
}
