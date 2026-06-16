'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { shiftSchema } from '@/lib/validations/shifts'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

interface ProficiencyRow {
  role_id: string
  location_id: string
  property_id: string
  roles: { id: string; name: string } | null
  locations: { id: string; name: string; property_id: string } | null
  properties: { id: string; name: string } | null
}

interface UniqueItem { id: string; name: string }
interface UniqueLocation { id: string; name: string; property_id: string }

interface PostShiftFormProps {
  userId: string
  displayName: string
  onSuccess?: () => void
}

export function PostShiftForm({ userId, displayName, onSuccess }: PostShiftFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [proficiencies, setProficiencies] = useState<ProficiencyRow[]>([])
  const [uniqueRoles, setUniqueRoles] = useState<UniqueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const [form, setForm] = useState({
    shift_title: '',
    role_id: '',
    property_id: '',
    location_id: '',
    start_time: '',
    end_time: '',
    is_trade: false,
    is_giveaway: false,
    is_overtime_approved: false,
    comments: '',
  })

  // Properties available for the selected role
  const availableProperties = useMemo(() => {
    if (!form.role_id) return []
    const propMap = new Map<string, UniqueItem>()
    proficiencies
      .filter(p => p.role_id === form.role_id && p.properties)
      .forEach(p => propMap.set(p.properties!.id, p.properties!))
    return [...propMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [proficiencies, form.role_id])

  // Locations available for the selected role + property
  const availableLocations = useMemo((): UniqueLocation[] => {
    if (!form.role_id || !form.property_id) return []
    const locMap = new Map<string, UniqueLocation>()
    proficiencies
      .filter(p => p.role_id === form.role_id && p.property_id === form.property_id && p.locations)
      .forEach(p => locMap.set(p.locations!.id, { ...p.locations!, property_id: p.property_id }))
    return [...locMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [proficiencies, form.role_id, form.property_id])

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from('user_proficiencies')
        .select(`
          role_id,
          location_id,
          property_id,
          roles(id, name),
          locations(id, name, property_id),
          properties(id, name)
        `)
        .eq('user_id', userId)
        .eq('is_approved', true) as { data: ProficiencyRow[] | null }

      const rows = data ?? []
      setProficiencies(rows)

      const roleMap = new Map<string, UniqueItem>()
      rows.forEach(r => { if (r.roles) roleMap.set(r.roles.id, r.roles) })
      setUniqueRoles([...roleMap.values()].sort((a, b) => a.name.localeCompare(b.name)))

      setDataLoading(false)
    }
    load()
  }, [userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'role_id' ? { property_id: '', location_id: '' } : {}),
      ...(name === 'property_id' ? { location_id: '' } : {}),
    }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const startUTC = form.start_time ? new Date(form.start_time).toISOString() : ''
    const endUTC = form.end_time ? new Date(form.end_time).toISOString() : ''

    const parseData = { ...form, start_time: startUTC, end_time: endUTC }
    const result = shiftSchema.safeParse(parseData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        const field = err.path[0] as string
        fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    // Derive property_id from the selected proficiency
    const prof = proficiencies.find(
      p => p.role_id === form.role_id && p.location_id === form.location_id
    )

    setLoading(true)
    try {
      const { error } = await (supabase as any).from('shifts').insert({
        created_by: displayName,
        user_id: userId,
        property_id: prof?.property_id ?? form.property_id,
        location_id: form.location_id,
        role_id: form.role_id,
        shift_title: form.shift_title,
        start_time: startUTC,
        end_time: endUTC,
        is_trade: form.is_trade,
        is_giveaway: form.is_giveaway,
        is_overtime_approved: form.is_overtime_approved,
        comments: form.comments || null,
        is_active: true,
      } as any)
      if (error) throw error
      onSuccess?.()
      router.push('/board')
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to post shift.')
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return <div className="flex items-center justify-center py-12 text-text/50">Loading form...</div>
  }

  if (uniqueRoles.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text/60">
        You have no proficiencies yet. <a href="/profile" className="text-primary underline">Add proficiencies</a> before posting a shift.
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

      {/* Shift Title */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Shift Title <span className="text-warning">*</span>
        </label>
        <input
          name="shift_title"
          type="text"
          className={`input placeholder:text-text/50 ${errors.shift_title ? 'border-warning' : ''}`}
          placeholder="e.g., Jungle Cruise Operator Morning"
          value={form.shift_title}
          onChange={handleChange}
        />
        <p className="mt-1 text-xs text-text/40">Please use the precise title of the shift as seen on your schedule.</p>
        {errors.shift_title && <p className="mt-1 text-xs text-warning">{errors.shift_title}</p>}
      </div>

      {/* Role — first */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Role <span className="text-warning">*</span>
        </label>
        <select name="role_id" className={`input ${errors.role_id ? 'border-warning' : ''}`} value={form.role_id} onChange={handleChange}>
          <option value="">Select role...</option>
          {uniqueRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {errors.role_id && <p className="mt-1 text-xs text-warning">{errors.role_id}</p>}
      </div>

      {/* Property */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Property <span className="text-warning">*</span>
        </label>
        <select name="property_id" className={`input ${errors.property_id ? 'border-warning' : ''}`} value={form.property_id} onChange={handleChange} disabled={!form.role_id}>
          <option value="">Select property...</option>
          {availableProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {errors.property_id && <p className="mt-1 text-xs text-warning">{errors.property_id}</p>}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Location <span className="text-warning">*</span>
        </label>
        <select name="location_id" className={`input ${errors.location_id ? 'border-warning' : ''}`} value={form.location_id} onChange={handleChange} disabled={!form.property_id}>
          <option value="">Select location...</option>
          {availableLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {errors.location_id && <p className="mt-1 text-xs text-warning">{errors.location_id}</p>}
      </div>

      {/* Start / End Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Start Time (ET) <span className="text-warning">*</span>
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
            End Time (ET) <span className="text-warning">*</span>
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
            <input type="checkbox" name="is_trade" checked={form.is_trade} onChange={handleChange} className="h-4 w-4 min-h-0 min-w-0 text-primary" />
            <span className="text-sm text-text">Trade</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer min-h-0">
            <input type="checkbox" name="is_giveaway" checked={form.is_giveaway} onChange={handleChange} className="h-4 w-4 min-h-0 min-w-0 text-primary" />
            <span className="text-sm text-text">Giveaway</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer min-h-0">
            <input type="checkbox" name="is_overtime_approved" checked={form.is_overtime_approved} onChange={handleChange} className="h-4 w-4 min-h-0 min-w-0 text-primary" />
            <span className="text-sm text-text">OT Approved</span>
          </label>
        </div>
        {errors.is_trade && <p className="mt-1 text-xs text-warning">{errors.is_trade}</p>}
      </div>

      {/* Comments */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Comments (optional)</label>
        <textarea
          name="comments"
          className="input h-20 resize-none"
          placeholder="Any additional details..."
          value={form.comments}
          onChange={handleChange}
          maxLength={500}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full gap-2">
        <Plus className="w-4 h-4" /> Post Shift
      </Button>
    </form>
  )
}
