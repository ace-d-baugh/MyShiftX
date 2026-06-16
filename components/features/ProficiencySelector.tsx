'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Property { id: string; name: string }
interface Location { id: string; name: string; property_id: string }
interface Role { id: string; name: string }
interface Proficiency {
  id: string
  property_id: string
  location_id: string
  role_id: string
  property_name: string
  location_name: string
  role_name: string
  is_approved: boolean
}

interface ProficiencySelectorProps {
  userId: string
  onUpdate?: () => void
}

export function ProficiencySelector({ userId, onUpdate }: ProficiencySelectorProps) {
  const supabase = createClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [proficiencies, setProficiencies] = useState<Proficiency[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedRole, setSelectedRole] = useState('')
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])

  const filteredLocations = locations.filter(l => l.property_id === selectedProperty)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [propsRes, locsRes, rolesRes, profRes] = await Promise.all([
        (supabase as any).from('properties').select('id, name').order('name'),
        (supabase as any).from('locations').select('id, name, property_id').eq('is_approved', true).order('name'),
        (supabase as any).from('roles').select('id, name').eq('is_approved', true).order('name'),
        (supabase as any).from('user_proficiencies')
          .select(`
            id,
            property_id,
            location_id,
            role_id,
            is_approved,
            properties(name),
            locations(name),
            roles(name)
          `)
          .eq('user_id', userId),
      ])
      setProperties(propsRes.data ?? [])
      setLocations(locsRes.data ?? [])
      setRoles(rolesRes.data ?? [])
      setProficiencies(
        (profRes.data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          property_id: p.property_id as string,
          location_id: p.location_id as string,
          role_id: p.role_id as string,
          is_approved: p.is_approved as boolean,
          property_name: (p.properties as { name: string } | null)?.name ?? '',
          location_name: (p.locations as { name: string } | null)?.name ?? '',
          role_name: (p.roles as { name: string } | null)?.name ?? '',
        }))
      )
    } catch {
      setError('Failed to load proficiency data.')
    } finally {
      setLoading(false)
    }
  }

  const toggleLocation = (locId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    )
  }

  const handleAdd = async () => {
    if (!selectedRole || !selectedProperty || selectedLocations.length === 0) {
      setError('Please select a role, property, and at least one location.')
      return
    }
    setSaving(true)
    setError(null)

    // Collect only locations not already in proficiencies for this role
    const existing = new Set(
      proficiencies
        .filter(p => p.role_id === selectedRole)
        .map(p => p.location_id)
    )
    const toInsert = selectedLocations
      .filter(locId => !existing.has(locId))
      .map(locId => ({
        user_id: userId,
        property_id: selectedProperty,
        location_id: locId,
        role_id: selectedRole,
        suggested_by_user_id: userId,
      }))

    try {
      if (toInsert.length > 0) {
        const { error: insertError } = await (supabase as any)
          .from('user_proficiencies')
          .insert(toInsert as any)
        if (insertError) throw insertError
      }
      setSelectedRole('')
      setSelectedProperty('')
      setSelectedLocations([])
      await loadData()
      onUpdate?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add proficiency.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (profId: string) => {
    setSaving(true)
    try {
      await (supabase as any).from('user_proficiencies').delete().eq('id', profId)
      await loadData()
      onUpdate?.()
    } catch {
      setError('Failed to remove proficiency.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text/60 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading proficiencies...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-text mb-1">My Proficiencies</h3>
        <p className="text-xs text-text/50">Add the roles and locations you can work to filter the board. New proficiencies need approval from a Mod/Leader before they unlock board access.</p>
      </div>

      {/* Existing proficiencies */}
      {proficiencies.length === 0 ? (
        <p className="text-sm text-text/50 italic">No proficiencies added yet.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] bg-primary-light px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-text/60 uppercase tracking-wide">Role</span>
            <span className="text-xs font-semibold text-text/60 uppercase tracking-wide">Property</span>
            <span className="text-xs font-semibold text-text/60 uppercase tracking-wide">Location</span>
            <span className="w-16" />
            <span className="w-6" />
          </div>
          {/* Rows */}
          {proficiencies.map((p, i) => (
            <div
              key={p.id}
              className={`grid grid-cols-[1fr_1fr_1fr_auto_auto] items-center px-3 py-2.5 gap-2 ${i % 2 === 1 ? 'bg-primary-light/30' : 'bg-card'}`}
            >
              <span className="text-sm font-medium text-text truncate">{p.role_name}</span>
              <span className="text-sm text-text/70 truncate">{p.property_name}</span>
              <span className="text-sm text-text/70 truncate">{p.location_name}</span>
              {p.is_approved ? (
                <span className="w-16" />
              ) : (
                <Badge variant="pending" className="text-xs py-0.5 shrink-0">Pending</Badge>
              )}
              <button
                onClick={() => handleRemove(p.id)}
                disabled={saving}
                className="text-warning/60 hover:text-warning transition-colors p-1 shrink-0 min-h-0 min-w-0"
                aria-label="Remove proficiency"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-text">Add Proficiency</p>
        <div className="grid grid-cols-1 gap-3">
          {/* Role — first */}
          <div>
            <label className="block text-xs font-medium text-text/60 mb-1">Role</label>
            <select
              className="input text-sm"
              value={selectedRole}
              onChange={e => {
                setSelectedRole(e.target.value)
                setSelectedProperty('')
                setSelectedLocations([])
              }}
            >
              <option value="">Select role...</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Property — second */}
          <div>
            <label className="block text-xs font-medium text-text/60 mb-1">Property</label>
            <select
              className="input text-sm"
              value={selectedProperty}
              onChange={e => {
                setSelectedProperty(e.target.value)
                setSelectedLocations([])
              }}
              disabled={!selectedRole}
            >
              <option value="">Select property...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Locations — multi-select checkboxes */}
          {selectedProperty && filteredLocations.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text/60 mb-2">Locations</label>
              <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {filteredLocations.map(l => (
                    <label key={l.id} className="flex items-center gap-2 cursor-pointer min-h-0 py-0.5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 min-h-0 min-w-0 text-primary rounded"
                        checked={selectedLocations.includes(l.id)}
                        onChange={() => toggleLocation(l.id)}
                      />
                      <span className="text-sm text-text">{l.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {selectedProperty && filteredLocations.length === 0 && (
            <p className="text-xs text-text/50 italic">No approved locations for this property.</p>
          )}
        </div>

        {error && <p className="text-xs text-warning">{error}</p>}

        <Button
          onClick={handleAdd}
          loading={saving}
          size="sm"
          className="gap-1 w-full"
          disabled={!selectedRole || !selectedProperty || selectedLocations.length === 0}
        >
          <Plus className="w-4 h-4" />
          Add {selectedLocations.length > 1 ? `${selectedLocations.length} Proficiencies` : 'Proficiency'}
        </Button>
      </div>
    </div>
  )
}
