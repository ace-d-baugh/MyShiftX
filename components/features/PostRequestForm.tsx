'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { requestSchema } from '@/lib/validations/shifts'
import { Button } from '@/components/ui/Button'
import { Plus, Save } from 'lucide-react'
import type { PreferredTime } from '@/lib/database.types'
import { notifyRequestPosted } from '@/app/actions/notifications'

const TIME_OPTIONS: { value: PreferredTime; label: string; desc: string }[] = [
  { value: 'morning',   label: 'Morning',    desc: '6am–12pm'  },
  { value: 'afternoon', label: 'Afternoon',  desc: '12pm–6pm'  },
  { value: 'evening',   label: 'Evening',    desc: '6pm–12am'  },
  { value: 'late',      label: 'Late Night', desc: '12am–6am'  },
]

interface Board { id: string; name: string }

export interface RequestInitialData {
  request_title: string
  board_id: string | null
  requested_date: string
  preferred_times: PreferredTime[]
  details: string | null
}

interface PostRequestFormProps {
  userId: string
  displayName: string
  onSuccess?: () => void
  requestId?: string
  initialData?: RequestInitialData
}

export function PostRequestForm({ userId, displayName, onSuccess, requestId, initialData }: PostRequestFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!requestId

  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const [form, setForm] = useState({
    request_title:   initialData?.request_title   ?? 'Shift Wanted',
    board_id:        initialData?.board_id        ?? '',
    requested_date:  initialData?.requested_date  ?? '',
    preferred_times: initialData?.preferred_times ?? ([] as PreferredTime[]),
    details:         initialData?.details         ?? '',
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
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const toggleTime = (t: PreferredTime) => {
    setForm(prev => ({
      ...prev,
      preferred_times: prev.preferred_times.includes(t)
        ? prev.preferred_times.filter(x => x !== t)
        : [...prev.preferred_times, t],
    }))
    setErrors(prev => ({ ...prev, preferred_times: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const result = requestSchema.safeParse(form)
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
          .from('requests')
          .update({
            request_title:   form.request_title,
            board_id:        form.board_id,
            requested_date:  form.requested_date,
            preferred_times: form.preferred_times,
            details:         form.details || null,
          })
          .eq('id', requestId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('requests').insert({
          created_by:      displayName,
          user_id:         userId,
          request_title:   form.request_title,
          board_id:        form.board_id,
          requested_date:  form.requested_date,
          preferred_times: form.preferred_times,
          details:         form.details || null,
          is_active:       true,
        })
        if (error) throw error
        // Fire-and-forget — notify both parties if a matching shift already exists
        notifyRequestPosted({
          boardId:        form.board_id,
          requestedDate:  form.requested_date,
          preferredTimes: form.preferred_times,
          requestTitle:   form.request_title,
          requesterName:  displayName,
          requesterUserId: userId,
        })
      }
      onSuccess?.()
      router.push('/wall?tab=requests')
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : isEdit ? 'Failed to update request.' : 'Failed to post request.')
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
        <a href="/profile" className="text-primary underline">Join or create a board</a> before posting a request.
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

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Title <span className="text-warning">*</span>
        </label>
        <input
          name="request_title"
          type="text"
          className={`input ${errors.request_title ? 'border-warning' : ''}`}
          value={form.request_title}
          onChange={handleChange}
          maxLength={100}
          placeholder="Shift Wanted"
        />
        {errors.request_title && <p className="mt-1 text-xs text-warning">{errors.request_title}</p>}
      </div>

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

      {/* Requested Date */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Date Needed <span className="text-warning">*</span>
        </label>
        <input
          name="requested_date"
          type="date"
          className={`input ${errors.requested_date ? 'border-warning' : ''}`}
          value={form.requested_date}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
        />
        {errors.requested_date && <p className="mt-1 text-xs text-warning">{errors.requested_date}</p>}
      </div>

      {/* Preferred Times */}
      <div>
        <p className="text-sm font-medium text-text mb-2">
          Preferred Time(s) <span className="text-warning">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TIME_OPTIONS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleTime(t.value)}
              className={`flex flex-col items-start p-3 rounded-lg border-2 text-left transition-colors ${
                form.preferred_times.includes(t.value)
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-border text-text/60 hover:border-primary/50'
              }`}
            >
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-xs opacity-70">{t.desc}</span>
            </button>
          ))}
        </div>
        {errors.preferred_times && <p className="mt-1 text-xs text-warning">{errors.preferred_times}</p>}
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
        {isEdit ? <><Save className="w-4 h-4" /> Update Request</> : <><Plus className="w-4 h-4" /> Post Request</>}
      </Button>
    </form>
  )
}
