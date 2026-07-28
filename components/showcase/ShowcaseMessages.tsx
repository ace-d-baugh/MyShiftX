import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConversationView } from '@/lib/showcase/render'

/**
 * The demo's messages view: the conversation list and every thread expanded
 * beneath it, rather than the real app's select-a-thread split pane.
 *
 * Deliberate — a crawler never clicks, so a master/detail layout would leave
 * the page looking empty. Rendering the threads inline means the content is
 * actually on the page.
 */
export function ShowcaseMessages({ conversations }: { conversations: ConversationView[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr] items-start">
      {/* Conversation list */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-accent font-bold text-text">Conversations</h2>
        </div>
        <ul className="divide-y divide-border">
          {conversations.map(c => (
            <li key={c.id}>
              <a
                href={`#thread-${c.id}`}
                className="block px-4 py-3 hover:bg-primary-light/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-medium text-sm text-text truncate">{c.withName}</span>
                  <span className="text-[11px] text-text/40 shrink-0">{c.lastActivity}</span>
                </div>
                <p className="text-xs text-text/50 truncate">{c.preview}</p>
                {c.unread > 0 && (
                  <span className="inline-block mt-1.5 text-[10px] font-semibold bg-primary text-white rounded-full px-2 py-0.5 leading-none">
                    {c.unread} new
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Threads */}
      <div className="space-y-6">
        {conversations.map(c => (
          <section key={c.id} id={`thread-${c.id}`} className="card scroll-mt-20">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 mb-4 border-b border-border">
              <div>
                <h3 className="font-accent font-bold text-text">{c.withName}</h3>
                <p className="text-xs text-text/50">
                  {c.withRole} · re: <span className="italic">{c.subject}</span>
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-text/50">
                <LayoutGrid className="w-3.5 h-3.5 opacity-70" />
                <span className="truncate max-w-[220px]">{c.boardName}</span>
              </span>
            </div>

            <div className="space-y-3">
              {c.messages.map(m => (
                <div key={m.id} className={cn('flex', m.fromMe ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[85%] sm:max-w-[70%]')}>
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        m.fromMe
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-primary-light/70 text-text rounded-bl-md'
                      )}
                    >
                      {m.body}
                    </div>
                    <div
                      className={cn(
                        'text-[11px] text-text/40 mt-1',
                        m.fromMe ? 'text-right' : 'text-left'
                      )}
                    >
                      {m.timeLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 pt-3 border-t border-border text-xs text-text/40 text-center">
              Replying is disabled in the demo.
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}
