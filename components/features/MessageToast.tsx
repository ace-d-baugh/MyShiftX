'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TOAST_MS = 5000

interface ToastData {
  conversationId: string
  senderName: string
  preview: string
}

/**
 * App-wide new-message toast. Subscribes to message INSERTs (RLS-filtered,
 * so only the user's own conversations arrive) and shows a 5-second toast
 * linking to the chat — unless the user is already viewing that thread.
 * Also refreshes the layout so the Navbar unread badge updates live.
 */
export function MessageToast({ currentUserId }: { currentUserId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [toast, setToast] = useState<ToastData | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Read inside the subscription callback without resubscribing on navigation
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('realtime:messages:toast')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new as {
            id: string; conversation_id: string; sender_id: string | null; body: string
          }
          if (!msg.sender_id || msg.sender_id === currentUserId) return
          // Already reading that thread — its own view handles it
          if (pathnameRef.current === `/messages/${msg.conversation_id}`) return

          const { data: sender } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', msg.sender_id)
            .single()

          setToast({
            conversationId: msg.conversation_id,
            senderName: sender?.display_name ?? 'Someone',
            preview: msg.body.length > 80 ? `${msg.body.slice(0, 77)}…` : msg.body,
          })
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => setToast(null), TOAST_MS)

          // Keep the Navbar unread badge current without a page reload
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [currentUserId, router])

  if (!toast) return null

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast(null)
  }

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-36 md:bottom-6 z-[60] w-[calc(100vw-2rem)] max-w-sm">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card shadow-xl">
        <button
          type="button"
          onClick={() => { dismiss(); router.push(`/messages/${toast.conversationId}`) }}
          className="flex items-center gap-3 flex-1 min-w-0 text-left min-h-0"
        >
          <span className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-primary" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-text truncate">
              New message from {toast.senderName}
            </span>
            <span className="block text-xs text-text/60 truncate">{toast.preview}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="p-1 rounded-md text-text/40 hover:text-text hover:bg-primary-light transition-colors min-h-0 min-w-0 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
