import { PageLoader } from '@/components/ui/LoadingSpinner'

// Root-level instant fallback (marketing + auth pages) so no route ever
// leaves the browser hanging on the PWA splash logo while the server works.
export default function RootLoading() {
  return <PageLoader />
}
