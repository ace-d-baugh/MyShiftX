'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { shiftSchema } from '@/lib/validations/shifts'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Plus, Save } from 'lucide-react'

interface Board { id: string; name: string }

export interface ShiftInitialData {
  board_id: string | null
  shift_title: string
  start_time: string
  end_time: string
  is_trade: boolean
  is_giveaway: boolean
  is_overtime_approved: boolean
  details: string | null
}

interface PostShiftFormProps {
  userId: string
  displayName: string
  onSuccess?: () => void
  shiftId?: string
  initialData?: ShiftInitialData
}

function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PostShiftForm({ userId, displayName, onSuccess, shiftId, initialData }: PostShiftFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!shiftId

  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const [form, setForm] = useState({
    board_id:              initialData?.board_id              ?? '',
    shift_title:           initialData?.shift_title           ?? '',
    start_time:            initialData ? toLocalDatetimeInput(initialData.start_time) : '',
    end_time:              initialData ? toLocalDatetimeInput(initialData.end_time)   : '',
    is_trade:              initialData?.is_trade              ?? false,
    is_giveaway:           initialData?.is_giveaway           ?? false,
    is_overtime_approved:  initialData?.is_overtime_approved  ?? false,
    details:               initialData?.details               ?? '',
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('user_boards')
        .select('board_id, boards(id, name)')
        .eq('user_id', userId)
        .eq('is_approved', true)

      const boardList = (data ?? [])
        .map((ub: { board_id: string; boards: Board | null }) => ub.boards)
        .filter((b): b is Board => !!b)
        .sort((a, b) => a.name.localeCompare(b.name))

      setBoards(boardList)
      if (!isEdit && boardList.length === 1) {
        setForm(prev => ({ ...prev, board_id: boardList[0].id }))
      }
      setDataLoading(false)
    }
    load()
  }, [userId, isEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const startUTC = form.start_time ? new Date(form.start_time).toISOString() : ''
    const endUTC   = form.end_time   ? new Date(form.end_time).toISOString()   : ''

    const result = shiftSchema.safeParse({ ...form, start_time: startUTC, end_time: endUTC })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach(err => { fieldErrors[err.path[0] as string] = err.message })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      if (isEdit) {
        const { error } = await supabase
          .from('shifts')
          .update({
            board_id:             form.board_id,
            shift_title:          form.shift_title,
            start_time:           startUTC,
            end_time:             endUTC,
            is_trade:             form.is_trade,
            is_giveaway:          form.is_giveaway,
            is_overtime_approved: form.is_overtime_approved,
            details:              form.details || null,
          })
          .eq('id', shiftId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('shifts').insert({
          created_by:           displayName,
          user_id:              userId,
          board_id:             form.board_id,
          shift_title:          form.shift_title,
          start_time:           startUTC,
          end_time:             endUTC,
          is_trade:             form.is_trade,
          is_giveaway:          form.is_giveaway,
          is_overtime_approved: form.is_overtime_approved,
          details:              form.details || null,
          is_active:            true,
        })
        if (error) throw error
      }
      onSuccess?.()
      router.push('/wall')
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : isEdit ? 'Failed to update shift.' : 'Failed to post shift.')
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return <div className="flex items-center justify-center py-12 text-text/50">Loading form...</div>
  }

  if (boards.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text/60">
        You haven&apos;t joined any boards yet.{' '}
        <a href="/profile" className="text-primary underline">Join or create a board</a> before posting a shift.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {serverError && (
        <div className="p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">
          {serverError}
        </div>
      )}

      {/* Board */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Board <span className="text-warning">*</span>
        </label>
        <select
          name="board_id"
          className={`input ${errors.board_id ? 'border-warning' : ''}`}
          value={form.board_id}
          onChange={handleChange}
        >
          <option value="">Select board...</option>
          {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {errors.board_id && <p className="mt-1 text-xs text-warning">{errors.board_id}</p>}
      </div>

      {/* Shift Title */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Shift Title <span className="text-warning">*</span>
        </label>
        <input
          name="shift_title"
          type="text"
          className={`input placeholder:text-text/30 ${errors.shift_title ? 'border-warning' : ''}`}
          placeholder="e.g., Morning Opening Shift"
          value={form.shift_title}
          onChange={handleChange}
        />
        <p className="mt-1 text-xs text-text/40">Use the exact title as it appears on your schedule.</p>
        {errors.shift_title && <p className="mt-1 text-xs text-warning">{errors.shift_title}</p>}
      </div>

      {/* Start / End Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Start Time <span className="text-warning">*</span>
          </label>
          <input
            name="start_time"
            type="datetime-local"
            className={`input ${errors.start_time ? 'border-warning' : ''}`}
            value={form.start_time}
            onChange={handleChange}
          />
          {errors.start_time && <p className="mt-1 text-xs text-warning">{errors.start_time}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            End Time <span className="text-warning">*</span>
          </label>
          <input
            name="end_time"
            type="datetime-local"
            className={`input ${errors.end_time ? 'border-warning' : ''}`}
            value={form.end_time}
            onChange={handleChange}
          />
          {errors.end_time && <p className="mt-1 text-xs text-warning">{errors.end_time}</p>}
        </div>
      </div>

      {/* Type checkboxes */}
      <div>
        <p className="text-sm font-medium text-text mb-2">
          Shift Type <span className="text-warning">*</span>
        </p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer min-h-0">
            <Checkbox name="is_trade" checked={form.is_trade} onChange={handleChange} />
            <span className="text-sm text-text">Trade</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer min-h-0">
            <Checkbox name="is_giveaway" checked={form.is_giveaway} onChange={handleChange} />
            <span className="text-sm text-text">Giveaway</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer min-h-0">
            <Checkbox name="is_overtime_approved" checked={form.is_overtime_approved} onChange={handleChange} />
            <span className="text-sm text-text">OT Approved</span>
          </label>
        </div>
        {errors.is_trade && <p className="mt-1 text-xs text-warning">{errors.is_trade}</p>}
      </div>

      {/* Details */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Details (optional)</label>
        <textarea
          name="details"
          className="input h-20 resize-none"
          placeholder="Any additional details..."
          value={form.details}
          onChange={handleChange}
          maxLength={500}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full gap-2">
        {isEdit ? <><Save className="w-4 h-4" /> Update Shift</> : <><Plus className="w-4 h-4" /> Post Shift</>}
      </Button>
    </form>
  )
}
