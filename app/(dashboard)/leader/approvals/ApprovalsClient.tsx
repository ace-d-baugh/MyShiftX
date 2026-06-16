'use client'

import { useState } from 'react'
import { CheckCircle, Trash2, MapPin, Briefcase, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'
import type { UserType } from '@/lib/database.types'

type ConfirmKind = 'profs' | 'locs' | 'roles'
type ConfirmAction = 'approve' | 'reject'
interface ConfirmState {
  kind: ConfirmKind
  action: ConfirmAction
  id: string
  label: string
}

const CONFIRM_COPY: Record<ConfirmKind, Record<ConfirmAction, { title: string; message: string }>> = {
  profs: {
    approve: {
      title: 'Confirm Cast Approval',
      message: 'Does this look right? Do you personally know this Cast Member and can confirm they actually work this role at this location?',
    },
    reject: {
      title: 'Confirm Rejection',
      message: 'Are you sure? The Cast Member will need to submit this request again.',
    },
  },
  locs: {
    approve: {
      title: 'Confirm Location Approval',
      message: 'Does this look right? Confirm the location name is accurate and belongs at this property before approving.',
    },
    reject: {
      title: 'Confirm Rejection',
      message: 'Are you sure you want to remove this location suggestion?',
    },
  },
  roles: {
    approve: {
      title: 'Confirm Role Approval',
      message: 'Does this look right? Confirm the role name is accurate before approving.',
    },
    reject: {
      title: 'Confirm Rejection',
      message: 'Are you sure you want to remove this role suggestion?',
    },
  },
}

interface PendingLocation {
  id: string
  name: string
  property_id: string
  created_at: string
  properties: { name: string } | null
  users: { display_name: string } | null
}

interface PendingRole {
  id: string
  name: string
  created_at: string
  users: { display_name: string } | null
}

interface PendingProficiency {
  id: string
  role_id: string
  location_id: string
  created_at: string
  roles: { name: string } | null
  properties: { name: string } | null
  locations: { name: string } | null
  users: { display_name: string } | null
}

interface ApprovalsClientProps {
  pendingLocations: PendingLocation[]
  pendingRoles: PendingRole[]
  pendingProficiencies: PendingProficiency[]
  approverId: string
  userRole: UserType
}

export function ApprovalsClient({ pendingLocations, pendingRoles, pendingProficiencies, approverId, userRole }: ApprovalsClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [locs, setLocs] = useState(pendingLocations)
  const [roles, setRoles] = useState(pendingRoles)
  const [profs, setProfs] = useState(pendingProficiencies)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const canManageRolesLocations = userRole === 'Leader' || userRole === 'Admin'

  const approveLocation = async (id: string) => {
    setProcessing(id)
    await (supabase as any).from('locations').update({
      is_approved: true,
      approved_by_user_id: approverId,
      approved_at: new Date().toISOString(),
    } as any).eq('id', id)
    setLocs(prev => prev.filter(l => l.id !== id))
    setProcessing(null)
  }

  const rejectLocation = async (id: string) => {
    setProcessing(id)
    await (supabase as any).from('locations').delete().eq('id', id)
    setLocs(prev => prev.filter(l => l.id !== id))
    setProcessing(null)
  }

  const approveRole = async (id: string) => {
    setProcessing(id)
    await (supabase as any).from('roles').update({
      is_approved: true,
      approved_by_user_id: approverId,
      approved_at: new Date().toISOString(),
    } as any).eq('id', id)
    setRoles(prev => prev.filter(r => r.id !== id))
    setProcessing(null)
  }

  const rejectRole = async (id: string) => {
    setProcessing(id)
    await (supabase as any).from('roles').delete().eq('id', id)
    setRoles(prev => prev.filter(r => r.id !== id))
    setProcessing(null)
  }

  const approveProficiency = async (id: string) => {
    setProcessing(id)
    await (supabase as any).from('user_proficiencies').update({
      is_approved: true,
      approved_by_user_id: approverId,
      approved_at: new Date().toISOString(),
    } as any).eq('id', id)
    setProfs(prev => prev.filter(p => p.id !== id))
    setProcessing(null)
  }

  const rejectProficiency = async (id: string) => {
    setProcessing(id)
    await (supabase as any).from('user_proficiencies').delete().eq('id', id)
    setProfs(prev => prev.filter(p => p.id !== id))
    setProcessing(null)
  }

  const runConfirmedAction = async () => {
    if (!confirm) return
    const { kind, action, id } = confirm
    if (kind === 'profs') {
      await (action === 'approve' ? approveProficiency(id) : rejectProficiency(id))
    } else if (kind === 'locs') {
      await (action === 'approve' ? approveLocation(id) : rejectLocation(id))
    } else {
      await (action === 'approve' ? approveRole(id) : rejectRole(id))
    }
    setConfirm(null)
  }

  const totalPending = locs.length + roles.length + profs.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-accent text-2xl font-bold text-text">Approval Queue</h1>
        <p className="text-sm text-text/60">
          {totalPending === 0 ? 'All caught up! No pending approvals.' : `${totalPending} item${totalPending !== 1 ? 's' : ''} awaiting approval`}
        </p>
      </div>

      {/* Pending Cast Proficiencies */}
      <section className="mb-8">
        <h2 className="font-accent text-lg font-bold text-text mb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" /> Cast Approvals ({profs.length})
        </h2>
        {profs.length === 0 ? (
          <p className="text-sm text-text/50 italic">No pending cast requests.</p>
        ) : (
          <div className="space-y-3">
            {profs.map(prof => (
              <div key={prof.id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-text">
                    {prof.roles?.name ?? 'Unknown Role'} · {prof.locations?.name ?? 'Unknown Location'}
                  </p>
                  <p className="text-xs text-text/50">
                    {prof.properties?.name ?? 'Unknown Property'}
                    {prof.users ? ` · Requested by ${prof.users.display_name}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={processing === prof.id}
                    onClick={() => setConfirm({
                      kind: 'profs',
                      action: 'approve',
                      id: prof.id,
                      label: `${prof.roles?.name ?? 'Unknown Role'} · ${prof.locations?.name ?? 'Unknown Location'}${prof.users ? ` — requested by ${prof.users.display_name}` : ''}`,
                    })}
                    className="gap-1 text-success border-success hover:bg-success/10 min-h-0 h-9 px-3"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={processing === prof.id}
                    onClick={() => setConfirm({
                      kind: 'profs',
                      action: 'reject',
                      id: prof.id,
                      label: `${prof.roles?.name ?? 'Unknown Role'} · ${prof.locations?.name ?? 'Unknown Location'}${prof.users ? ` — requested by ${prof.users.display_name}` : ''}`,
                    })}
                    className="gap-1 min-h-0 h-9 px-3"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {canManageRolesLocations && (
        <>
          {/* Pending Locations */}
          <section className="mb-8">
            <h2 className="font-accent text-lg font-bold text-text mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Locations ({locs.length})
            </h2>
            {locs.length === 0 ? (
              <p className="text-sm text-text/50 italic">No pending locations.</p>
            ) : (
              <div className="space-y-3">
                {locs.map(loc => (
                  <div key={loc.id} className="card flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-text">{loc.name}</p>
                      <p className="text-xs text-text/50">
                        {loc.properties?.name ?? 'Unknown Property'}
                        {loc.users ? ` · Suggested by ${loc.users.display_name}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={processing === loc.id}
                        onClick={() => setConfirm({
                          kind: 'locs',
                          action: 'approve',
                          id: loc.id,
                          label: `${loc.name}${loc.properties ? ` — ${loc.properties.name}` : ''}`,
                        })}
                        className="gap-1 text-success border-success hover:bg-success/10 min-h-0 h-9 px-3"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={processing === loc.id}
                        onClick={() => setConfirm({
                          kind: 'locs',
                          action: 'reject',
                          id: loc.id,
                          label: `${loc.name}${loc.properties ? ` — ${loc.properties.name}` : ''}`,
                        })}
                        className="gap-1 min-h-0 h-9 px-3"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pending Roles */}
          <section>
            <h2 className="font-accent text-lg font-bold text-text mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Roles ({roles.length})
            </h2>
            {roles.length === 0 ? (
              <p className="text-sm text-text/50 italic">No pending roles.</p>
            ) : (
              <div className="space-y-3">
                {roles.map(role => (
                  <div key={role.id} className="card flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-text">{role.name}</p>
                      <p className="text-xs text-text/50">
                        {role.users ? `Suggested by ${role.users.display_name}` : 'No suggester info'}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={processing === role.id}
                        onClick={() => setConfirm({ kind: 'roles', action: 'approve', id: role.id, label: role.name })}
                        className="gap-1 text-success border-success hover:bg-success/10 min-h-0 h-9 px-3"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={processing === role.id}
                        onClick={() => setConfirm({ kind: 'roles', action: 'reject', id: role.id, label: role.name })}
                        className="gap-1 min-h-0 h-9 px-3"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm ? CONFIRM_COPY[confirm.kind][confirm.action].title : undefined}
        size="sm"
      >
        {confirm && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-text">{confirm.label}</p>
            <p className="text-sm text-text/70">{CONFIRM_COPY[confirm.kind][confirm.action].message}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirm(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant={confirm.action === 'approve' ? 'outline' : 'danger'}
                loading={processing === confirm.id}
                onClick={runConfirmedAction}
                className={confirm.action === 'approve' ? 'flex-1 text-success border-success hover:bg-success/10' : 'flex-1'}
              >
                {confirm.action === 'approve' ? 'Yes, Approve' : 'Yes, Remove'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
