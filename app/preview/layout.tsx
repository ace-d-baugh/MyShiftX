import { Footer } from '@/components/landing/Footer'

/**
 * Shell for the public demo (see lib/showcase/mode.ts).
 *
 * Deliberately not the dashboard layout — that one calls requireUser() and
 * redirects, which is the whole problem we're routing around. These pages
 * render for signed-out visitors only; middleware sends anyone with a session
 * to the real app instead.
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
