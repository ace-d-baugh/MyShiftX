import { cn } from '@/lib/utils'

type BadgeVariant = 'trade' | 'giveaway' | 'give-trade' | 'ot' | 'pending' | 'guest' | 'user' | 'mod' | 'leader' | 'admin'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    trade: 'badge badge-trade',
    giveaway: 'badge badge-giveaway',
    'give-trade': 'badge bg-primary/20 text-primary',
    ot: 'badge badge-ot',
    pending: 'badge bg-accent/20 text-text',
    guest: 'badge bg-text/10 text-text/60',
    user: 'badge bg-secondary/40 text-text',
    mod: 'badge bg-info/20 text-info',
    leader: 'badge bg-secondary-accent text-text dark:text-secondary',
    admin: 'badge bg-warning/20 text-warning',
  }
  return <span className={cn(variants[variant], className)}>{children}</span>
}
