import { PageLoader } from '@/components/ui/LoadingSpinner'

// Catch-all instant fallback for dashboard routes without their own
// loading file (boards, help, leader, admin, kanban). Wall, Calendar,
// Profile, and Messages have dedicated skeletons instead.
export default function DashboardLoading() {
  return <PageLoader />
}
