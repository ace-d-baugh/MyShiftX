'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, CalendarDays, LayoutDashboard, Bell, Check, ArrowRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { dismissOnboarding } from '@/app/actions/onboarding'
import { ScheduleImportModal } from '@/components/features/ScheduleImportModal'
import { MyBoardsSection } from '@/components/features/MyBoardsSection'
import { PushNotificationsToggle } from '@/components/features/PushNotificationsToggle'
import { IosInstallPrompt } from '@/components/features/IosInstallPrompt'
import { cn } from '@/lib/utils'

interface WelcomeClientProps {
  userId: string
  displayName: string
  importEnabled: boolean
  initialShiftCount: number
  initialBoardCount: number
}

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <div className={cn(
      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm',
      done ? 'bg-success text-white' : 'bg-primary/15 text-primary'
    )}>
      {done ? <Check className="w-4 h-4" /> : n}
    </div>
  )
}

/**
 * Task 22: schedule-first onboarding. The app is useful solo on day one —
 * get the user's schedule onto their calendar before they ever see an empty
 * wall, then connect them to a board and turn on notifications.
 */
export function WelcomeClient({ userId, displayName, importEnabled, initialShiftCount, initialBoardCount }: WelcomeClientProps) {
  const supabase = createClient()
  const router = useRouter()

  const [shiftCount, setShiftCount] = useState(initialShiftCount)
  const [boardCount, setBoardCount] = useState(initialBoardCount)
  const [importOpen, setImportOpen] = useState(false)
  const [createBoardOpen, setCreateBoardOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const refreshCounts = useCallback(async () => {
    const [{ count: sc }, { count: bc }] = await Promise.all([
      supabase.from('shifts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
      supabase.from('user_boards').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ])
    if (sc !== null) setShiftCount(sc)
    if (bc !== null) setBoardCount(bc)
  }, [supabase, userId])

  // Counts change from inside the embedded import modal / boards section, so
  // refresh whenever the tab regains focus and when the import modal closes.
  useEffect(() => {
    const onFocus = () => { refreshCounts().catch(() => {}) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshCounts])

  const finish = async () => {
    setLeaving(true)
    await dismissOnboarding().catch(() => {})
    router.push('/wall')
  }

  const scheduleDone = shiftCount > 0
  const boardsDone = boardCount > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-accent text-3xl font-bold text-text mb-2">
          Welcome{displayName ? `, ${displayName}` : ''}! 👋
        </h1>
        <p className="text-text/60 text-sm">
          Three quick steps and MyShiftX starts working for you — even before your coworkers show up.
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1 — schedule first: useful solo, on day one */}
        <div className="card shadow-sm">
          <div className="flex items-start gap-3">
            <StepBadge n={1} done={scheduleDone} />
            <div className="flex-1 min-w-0">
              <h2 className="font-accent font-bold text-text">Put your schedule on your calendar</h2>
              {scheduleDone ? (
                <p className="text-sm text-success mt-1">
                  ✓ {shiftCount} shift{shiftCount === 1 ? '' : 's'} on your calendar — nice.{' '}
                  <Link href="/calendar" className="text-primary hover:underline">View it</Link>
                </p>
              ) : (
                <>
                  <p className="text-sm text-text/60 mt-1 mb-3">
                    {importEnabled
                      ? 'Snap a photo of your work schedule — paper or screen — and watch it land on your calendar in seconds.'
                      : 'Add your shifts so your schedule is always in your pocket.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {importEnabled && (
                      <button onClick={() => setImportOpen(true)} className="btn btn-primary gap-1.5 text-sm px-4 py-2 min-h-0">
                        <Camera className="w-4 h-4" /> Import from a photo
                      </button>
                    )}
                    <Link href="/calendar" className="text-sm text-primary hover:underline flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" /> {importEnabled ? 'or add shifts manually' : 'Open My Calendar'}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Step 2 — join the crew */}
        <div className="card shadow-sm">
          <div className="flex items-start gap-3">
            <StepBadge n={2} done={boardsDone} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-accent font-bold text-text flex-1">Join your board</h2>
                <button
                  onClick={() => setCreateBoardOpen(true)}
                  disabled={!displayName}
                  className="p-1.5 rounded-md border border-border text-text/40 hover:text-primary hover:border-primary hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-0 min-w-0"
                  title="Create a board"
                  aria-label="Create a board"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-text/60 mt-1 mb-3">
                Boards are private groups where your coworkers trade shifts. Got a 7-character invite
                code from a coworker? Enter it below — or create a board and invite them.
              </p>
              <MyBoardsSection
                userId={userId}
                displayNameReady={!!displayName}
                createOpen={createBoardOpen}
                onCreateOpenChange={setCreateBoardOpen}
              />
            </div>
          </div>
        </div>

        {/* Step 3 — notifications */}
        <div className="card shadow-sm">
          <div className="flex items-start gap-3">
            <StepBadge n={3} done={false} />
            <div className="flex-1 min-w-0">
              <h2 className="font-accent font-bold text-text flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-info" /> Never miss a shift
              </h2>
              <p className="text-sm text-text/60 mt-1 mb-3">
                Shifts go fast — the first person to hear about one usually gets it. Turn on push
                notifications so claims and matches reach you instantly. Email updates are already on;
                manage both anytime in your <Link href="/profile" className="text-primary hover:underline">profile</Link>.
              </p>
              <PushNotificationsToggle />
              {/* iOS browser tab: the toggle above hides itself — show the
                  Home Screen install walkthrough instead (Task 23) */}
              <IosInstallPrompt variant="inline" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button onClick={finish} disabled={leaving} className="btn btn-primary gap-1.5 px-6">
          <LayoutDashboard className="w-4 h-4" />
          {leaving ? 'Loading…' : 'Take me to the Wall'}
          <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={finish} disabled={leaving} className="text-xs text-text/40 hover:text-text/70 transition-colors min-h-0">
          Skip for now — I&apos;ll set up later
        </button>
      </div>

      <ScheduleImportModal
        userId={userId}
        displayName={displayName || 'User'}
        open={importOpen}
        onClose={() => { setImportOpen(false); refreshCounts().catch(() => {}) }}
      />
    </div>
  )
}
