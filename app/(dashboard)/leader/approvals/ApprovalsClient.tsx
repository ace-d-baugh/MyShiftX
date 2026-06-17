'use client'

import { useState } from 'react'
import { CheckCircle, X, UserCheck, LayoutGrid } from 'lucide-react'
import { approveUserBoard, rejectUserBoard } from '@/app/actions/boards'
import { Button } from '@/components/ui/Button'

interface PendingRequest {
  id: string
  board_id: string
  requested_at: string
  users: { display_name: string } | null
  boards: { name: string } | null
}

interface ApprovalsClientProps {
  pendingRequests: PendingRequest[]
  approverId: string
}

export function ApprovalsClient({ pendingRequests: initial, approverId }: ApprovalsClientProps) {
  const [requests, setRequests] = useState(initial)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    setProcessing(id)
    setError(null)
    const result = await approveUserBoard(id, approverId)
    if (result.error) {
      setError(result.error)
    } else {
      setRequests(prev => prev.filter(r => r.id !== id))
    }
    setProcessing(null)
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    setError(null)
    const result = await rejectUserBoard(id)
    if (result.error) {
      setError(result.error)
    } else {
      setRequests(prev => prev.filter(r => r.id !== id))
    }
    setProcessing(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-accent text-2xl font-bold text-text">Approval Queue</h1>
        <p className="text-sm text-text/60">
          {requests.length === 0
            ? 'All caught up! No pending board join requests.'
            : `${requests.length} request${requests.length !== 1 ? 's' : ''} awaiting approval`}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">
          {error}
          <button className="ml-2 underline text-xs" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <section>
        <h2 className="font-accent text-lg font-bold text-text mb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" /> Board Join Requests ({requests.length})
        </h2>

        {requests.length === 0 ? (
          <p className="text-sm text-text/50 italic">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-text">
                    {req.users?.display_name ?? 'Unknown User'}
                  </p>
                  <p className="text-xs text-text/50 flex items-center gap-1 mt-0.5">
                    <LayoutGrid className="w-3 h-3" />
                    wants to join <strong className="text-text/70">{req.boards?.name ?? 'Unknown Board'}</strong>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={processing === req.id}
                    onClick={() => handleApprove(req.id)}
                    className="gap-1 text-success border-success hover:bg-success/10 min-h-0 h-9 px-3"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={processing === req.id}
                    onClick={() => handleReject(req.id)}
                    className="gap-1 min-h-0 h-9 px-3"
                  >
                    <X className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
