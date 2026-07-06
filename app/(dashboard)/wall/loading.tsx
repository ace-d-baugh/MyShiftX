import { WallSkeleton } from '@/components/ui/WallSkeleton'

// Without this file, Next.js has no instant fallback for the route segment —
// it waits for WallPage's server-side awaits (requireUser + board fetch) to
// fully resolve before sending any HTML, which on a slow mobile connection
// shows as a blank screen (or the PWA splash icon lingering) instead of the
// skeleton. This streams in immediately on navigation.
export default function WallLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <WallSkeleton tab="offers" />
    </div>
  )
}
