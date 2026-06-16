'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { requestSchema } from '@/lib/validations/shifts'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import type { PreferredTime } from '@/lib/database.types'

const TIME_OPTIONS: { value: PreferredTime; label: string; desc: string }[] = [
  { value: 'morning', label: 'Morning', desc: '6am–12pm' },
  { value: 'afternoon', label: 'Afternoon', desc: '12pm–6pm' },
  { value: 'evening', label: 'Evening', desc: '6pm–12am' },
  { value: 'late', label: 'Late Night', desc: '12am–6am' },
]

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

interface PostRequestFormProps {
  userId: string
  displayName: string
  onSuccess?: () => void
}

export function PostRequestForm({ userId, displayName, onSuccess }: PostRequestFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [proficiencies, setProficiencies] = useState<ProficiencyRow[]>([])
  const [uniqueRoles, setUniqueRoles] = useState<UniqueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const [form, setForm] = useState({
    role_id: '',
    property_id: '',
    location_id: '',
    requested_date: '',
    preferred_times: [] as PreferredTime[],
    details: '',
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
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'role_id' ? { property_id: '', location_id: '' } : {}),
      ...(name === 'property_id' ? { location_id: '' } : {}),
    }))
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
      const { error } = await (supabase as any).from('requests').insert({
        created_by: displayName,
        user_id: userId,
        property_id: prof?.property_id ?? form.property_id,
        location_id: form.location_id,
        role_id: form.role_id,
        requested_date: form.requested_date,
        preferred_times: form.preferred_times,
        details: form.details || null,
        is_active: true,
      } as any)
      if (error) throw error
      onSuccess?.()
      router.push('/board')
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to post request.')
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
        You have no proficiencies yet. <a href="/profile" className="text-primary underline">Add proficiencies</a> before posting a request.
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
        <Plus className="w-4 h-4" /> Post Request
      </Button>
    </form>
  )
}
