'use client'

import { useState, useEffect, forwardRef } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { createClient } from '@/lib/supabase/client'
import { shiftSchema } from '@/lib/validations/shifts'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Plus, Save, X, ArrowLeft, ChevronDown, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { notifyShiftPosted } from '@/app/actions/notifications'
import { getSettings } from '@/lib/settings'

interface Board { id: string; name: string }

type ShiftForm = {
  board_id: string
  shift_title: string
  start_time: string
  end_time: string
  is_trade: boolean
  is_giveaway: boolean
  is_overtime_approved: boolean
  details: string
}

const blank = (board_id = ''): ShiftForm => ({
  board_id, shift_title: '', start_time: '', end_time: '',
  is_trade: false, is_giveaway: false, is_overtime_approved: false, details: '',
})

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
  wallExpanded?: boolean   // true = wall open by default, false (calendar) = collapsed
}

function toLocal(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function toDate(dt: string): Date | null {
  return dt ? new Date(dt) : null
}

function isActualToday(date: Date): boolean {
  const t = new Date()
  return date.getFullYear() === t.getFullYear() &&
    date.getMonth()    === t.getMonth()    &&
    date.getDate()     === t.getDate()
}

function fromDate(d: Date | null): string {
  if (!d) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function buildDateFormat(dateFormat: 'mdy' | 'dmy', timeFormat: '12h' | '24h'): string {
  return `${dateFormat === 'dmy' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'} ${timeFormat === '24h' ? 'HH:mm' : 'h:mm aa'}`
}

interface DateInputProps {
  value?: string
  onClick?: () => void
  placeholder?: string
  hasError?: boolean
  onClear?: () => void
}
const DateTimeInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onClick, placeholder, hasError, onClear }, ref) => (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40 dark:text-primary pointer-events-none z-10" />
      <input ref={ref} readOnly value={value ?? ''} onClick={onClick}
        placeholder={placeholder ?? 'Select date & time'}
        className={`input pl-9 ${value ? 'pr-8' : ''} cursor-pointer ${hasError ? 'border-warning' : ''}`} />
      {value && onClear && (
        <button type="button" onClick={e => { e.stopPropagation(); onClear() }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-text/40 hover:text-text min-h-0 min-w-0 z-10"
          aria-label="Clear date">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
)
DateTimeInput.displayName = 'DateTimeInput'

function isTouched(f: ShiftForm) {
  return !!f.shift_title || !!f.start_time || !!f.end_time ||
    f.is_trade || f.is_giveaway || f.is_overtime_approved || !!f.details
}

export function PostShiftForm({ userId, displayName, onSuccess, shiftId, initialData, wallExpanded = true }: PostShiftFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!shiftId

  const [boards, setBoards] = useState<Board[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const firstForm: ShiftForm = initialData ? {
    board_id:             initialData.board_id ?? '',
    shift_title:          initialData.shift_title,
    start_time:           toLocal(initialData.start_time),
    end_time:             toLocal(initialData.end_time),
    is_trade:             initialData.is_trade,
    is_giveaway:          initialData.is_giveaway,
    is_overtime_approved: initialData.is_overtime_approved,
    details:              initialData.details ?? '',
  } : blank()

  const [forms, setForms] = useState<ShiftForm[]>([firstForm])
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>[]>([{}])
  const [wallOpen, setWallOpen] = useState<boolean[]>([isEdit ? true : wallExpanded])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('user_boards').select('board_id, boards(id, name)')
        .eq('user_id', userId).eq('is_approved', true)
      const list = (data ?? [])
        .map((ub: { board_id: string; boards: Board | null }) => ub.boards)
        .filter((b): b is Board => !!b)
        .sort((a, b) => a.name.localeCompare(b.name))
      setBoards(list)
      if (!isEdit && list.length === 1) {
        setForms(prev => prev.map(f => f.board_id ? f : { ...f, board_id: list[0].id }))
      }
      setDataLoading(false)
    }
    load()
  }, [userId, isEdit]) // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (i: number, name: string, value: unknown) => {
    setForms(prev => prev.map((f, idx) => idx === i ? { ...f, [name]: value } : f))
    setFormErrors(prev => prev.map((e, idx) => idx === i ? { ...e, [name]: undefined } : e))
  }

  const onChange = (i: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setField(i, name, type === 'checkbox' ? (e.target as HTMLInputElement).checked : value)
  }

  const addForm = () => {
    setForms(prev => [...prev, blank(prev[prev.length - 1].board_id)])
    setFormErrors(prev => [...prev, {}])
    setWallOpen(prev => [...prev, prev[prev.length - 1]])  // inherit last form's state
  }

  const removeForm = (i: number) => {
    setForms(prev => prev.filter((_, idx) => idx !== i))
    setFormErrors(prev => prev.filter((_, idx) => idx !== i))
    setWallOpen(prev => prev.filter((_, idx) => idx !== i))
  }

  const toggleWall = (i: number) =>
    setWallOpen(prev => prev.map((v, idx) => idx === i ? !v : v))

  const settings = getSettings()
  const dateFormat = buildDateFormat(settings.dateFormat, settings.timeFormat)
  const timeFormat = settings.timeFormat === '24h' ? 'HH:mm' : 'h:mm aa'
  const minDate = new Date(new Date().setHours(0, 0, 0, 0))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    // Validate each form (skip completely blank subsequent ones)
    const newErrors: Record<string, string | undefined>[] = forms.map(() => ({}))
    let hasErrors = false

    forms.forEach((f, i) => {
      if (i > 0 && !isTouched(f)) return
      const startUTC = f.start_time ? new Date(f.start_time).toISOString() : ''
      const endUTC   = f.end_time   ? new Date(f.end_time).toISOString()   : ''
      const result = shiftSchema.safeParse({ ...f, start_time: startUTC, end_time: endUTC })
      if (!result.success) {
        result.error.errors.forEach(err => {
          const field = err.path[0] as string
          if (!newErrors[i][field]) newErrors[i][field] = err.message
        })
        hasErrors = true
      }
    })

    if (hasErrors) { setFormErrors(newErrors); return }

    setLoading(true)
    try {
      if (isEdit) {
        const f = forms[0]
        const startUTC = f.start_time ? new Date(f.start_time).toISOString() : ''
        const endUTC   = f.end_time   ? new Date(f.end_time).toISOString()   : ''
        const { error } = await supabase.from('shifts').update({
          board_id: f.board_id, shift_title: f.shift_title,
          start_time: startUTC, end_time: endUTC,
          is_trade: f.is_trade, is_giveaway: f.is_giveaway,
          is_overtime_approved: f.is_overtime_approved, details: f.details || null,
        }).eq('id', shiftId!).eq('user_id', userId)
        if (error) throw error
      } else {
        for (const [i, f] of forms.entries()) {
          if (i > 0 && !isTouched(f)) continue
          const startUTC = f.start_time ? new Date(f.start_time).toISOString() : ''
          const endUTC   = f.end_time   ? new Date(f.end_time).toISOString()   : ''
          const { error } = await supabase.from('shifts').insert({
            created_by: displayName, user_id: userId, board_id: f.board_id,
            shift_title: f.shift_title, start_time: startUTC, end_time: endUTC,
            is_trade: f.is_trade, is_giveaway: f.is_giveaway,
            is_overtime_approved: f.is_overtime_approved, details: f.details || null, is_active: true,
          })
          if (error) throw error
          notifyShiftPosted({ boardId: f.board_id, startTimeIso: startUTC, shiftTitle: f.shift_title, posterName: displayName, posterUserId: userId })
        }
      }
      onSuccess?.()
      router.push('/wall')
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : isEdit ? 'Failed to update shift.' : 'Failed to post shift.')
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) return <div className="card shadow-sm flex items-center justify-center py-12 text-text/50">Loading...</div>

  if (boards.length === 0) return (
    <div className="card shadow-sm py-8 text-center text-sm text-text/60">
      You haven&apos;t joined any boards yet.{' '}
      <a href="/profile" className="text-primary underline">Join or create a board</a> first.
    </div>
  )

  const submitCount = forms.filter((f, i) => i === 0 || isTouched(f)).length

  const isFormComplete = (f: ShiftForm) =>
    (boards.length <= 1 || !!f.board_id) &&
    !!f.shift_title.trim() &&
    !!f.start_time &&
    !!f.end_time

  const hasTimeConflict = forms.some(f =>
    f.start_time && f.end_time && new Date(f.end_time) <= new Date(f.start_time)
  )

  const canSubmit = !hasTimeConflict &&
    forms.every((f, i) => i === 0 ? isFormComplete(f) : !isTouched(f) || isFormComplete(f))

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {serverError && (
        <div className="p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">{serverError}</div>
      )}

      {forms.map((f, i) => {
        const errs = formErrors[i] ?? {}
        const partial = i > 0 && isTouched(f) && Object.keys(errs).some(k => errs[k])

        return (
          <div key={i} className="card shadow-sm">
            {/* Card header — only when there's more than one form or in edit mode */}
            {(forms.length > 1 || isEdit) && (
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <span className="text-sm font-semibold text-text">
                  {isEdit ? 'Shift Details' : `Shift ${i + 1}`}
                </span>
                {i > 0 && (
                  <button type="button" onClick={() => removeForm(i)}
                    className="flex items-center gap-1 text-xs text-warning hover:text-warning/80 min-h-0 min-w-0 transition-colors">
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            )}

            {partial && (
              <div className="mb-3 p-2.5 rounded-md bg-warning/10 border border-warning/20 text-warning text-xs">
                Please complete all required fields or remove this shift.
              </div>
            )}

            <div className="space-y-4">
              {/* Board — hidden when user belongs to only one board (auto-selected) */}
              {boards.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Board <span className="text-warning">*</span></label>
                  <select name="board_id" value={f.board_id} onChange={onChange(i)}
                    className={`input ${errs.board_id ? 'border-warning' : ''}`}>
                    <option value="">Select board...</option>
                    {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {errs.board_id && <p className="mt-1 text-xs text-warning">{errs.board_id}</p>}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text mb-1">Shift Title <span className="text-warning">*</span></label>
                <input name="shift_title" type="text" value={f.shift_title} onChange={onChange(i)}
                  className={`input placeholder:text-text/30 ${errs.shift_title ? 'border-warning' : ''}`}
                  placeholder="e.g., Morning Opening" maxLength={35} />
                <p className="mt-1 text-xs text-text/40">Use the exact title as it appears on your schedule.</p>
                {errs.shift_title && <p className="mt-1 text-xs text-warning">{errs.shift_title}</p>}
              </div>

              {/* Times */}
              {(() => {
                const endBeforeStart = !!(f.start_time && f.end_time &&
                  new Date(f.end_time) <= new Date(f.start_time))
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">Start Time <span className="text-warning">*</span></label>
                      <DatePicker
                        selected={toDate(f.start_time)}
                        onChange={(d: Date | null) => setField(i, 'start_time', fromDate(d))}
                        showTimeSelect
                        timeIntervals={5}
                        timeFormat={timeFormat}
                        dateFormat={dateFormat}
                        calendarStartDay={settings.weekStart as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                        minDate={minDate}
                        dayClassName={d => isActualToday(d) ? 'rdp-today' : ''}
                        placeholderText="Select date & time"
                        customInput={<DateTimeInput hasError={!!errs.start_time} onClear={() => setField(i, 'start_time', '')} />}
                        popperPlacement="bottom-start"
                        wrapperClassName="w-full"
                      />
                      {errs.start_time && <p className="mt-1 text-xs text-warning">{errs.start_time}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">End Time <span className="text-warning">*</span></label>
                      <DatePicker
                        selected={toDate(f.end_time)}
                        onChange={(d: Date | null) => setField(i, 'end_time', fromDate(d))}
                        showTimeSelect
                        timeIntervals={5}
                        timeFormat={timeFormat}
                        dateFormat={dateFormat}
                        calendarStartDay={settings.weekStart as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                        minDate={toDate(f.start_time) ?? minDate}
                        dayClassName={d => isActualToday(d) ? 'rdp-today' : ''}
                        placeholderText="Select date & time"
                        customInput={<DateTimeInput hasError={!!errs.end_time || endBeforeStart} onClear={() => setField(i, 'end_time', '')} />}
                        popperPlacement="bottom-start"
                        wrapperClassName="w-full"
                      />
                      {endBeforeStart
                        ? <p className="mt-1 text-xs text-warning">End time must be after start time.</p>
                        : errs.end_time && <p className="mt-1 text-xs text-warning">{errs.end_time}</p>}
                    </div>
                  </div>
                )
              })()}

              {/* Post to Wall + Details — accordion */}
              <div className="rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleWall(i)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-primary-light/20 hover:bg-primary-light/40 transition-colors min-h-0 text-left"
                >
                  <span className="text-sm font-medium text-text">
                    Post to Wall
                    {(f.is_trade || f.is_giveaway) && (
                      <span className="ml-2 text-xs text-primary font-normal">
                        ({[f.is_giveaway && 'Giveaway', f.is_trade && 'Trade'].filter(Boolean).join(' + ')})
                      </span>
                    )}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 text-text/40 transition-transform duration-200 shrink-0', (wallOpen[i] ?? wallExpanded) && 'rotate-180')} />
                </button>

                {(wallOpen[i] ?? wallExpanded) && (
                  <div className="px-3 pt-3 pb-3 space-y-4 border-t border-border">
                    <div>
                      <p className="text-xs text-text/50 mb-2">Leave unchecked to add to your calendar only.</p>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer min-h-0">
                          <Checkbox name="is_giveaway" checked={f.is_giveaway} onChange={onChange(i)} />
                          <span className="text-sm text-text">Giveaway</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer min-h-0">
                          <Checkbox name="is_trade" checked={f.is_trade} onChange={onChange(i)} />
                          <span className="text-sm text-text">Trade</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer min-h-0">
                          <Checkbox name="is_overtime_approved" checked={f.is_overtime_approved} onChange={onChange(i)} />
                          <span className="text-sm text-text">OT Approved</span>
                        </label>
                      </div>
                      {errs.is_trade && <p className="mt-1 text-xs text-warning">{errs.is_trade}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text/70 mb-1">Details (optional)</label>
                      <textarea name="details" value={f.details} onChange={onChange(i)}
                        className="input h-20 resize-none text-sm" placeholder="Any additional details..." maxLength={500} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Add another (create mode only) */}
      {!isEdit && (
        <button type="button" onClick={addForm}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/70 transition-colors min-h-0">
          <Plus className="w-4 h-4" /> Add Another Shift
        </button>
      )}

      {/* Cancel + Submit */}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="danger-outline" onClick={() => router.back()} className="gap-1.5 shrink-0">
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Button>
        <Button type="submit" loading={loading} disabled={!canSubmit} className="flex-1 gap-1.5">
          {isEdit
            ? <><Save className="w-4 h-4" /> Update Shift</>
            : submitCount > 1
              ? <><Plus className="w-4 h-4" /> Post {submitCount} Shifts</>
              : <><Plus className="w-4 h-4" /> Post Shift</>}
        </Button>
      </div>
    </form>
  )
}
