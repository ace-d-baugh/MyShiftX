import { cn } from '@/lib/utils'

type BadgeVariant = 'trade' | 'giveaway' | 'ot' | 'pending' | 'guest' | 'cast' | 'mod' | 'leader' | 'admin'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    trade: 'badge badge-trade',
    giveaway: 'badge badge-giveaway',
    ot: 'badge badge-ot',
    pending: 'badge bg-accent/20 text-text',
    guest: 'badge bg-text/10 text-text/60',
    cast: 'badge bg-secondary/40 text-text',
    mod: 'badge bg-info/20 text-info',
    leader: 'badge bg-primary/20 text-primary',
    admin: 'badge bg-warning/20 text-warning',
  }
  return <span className={cn(variants[variant], className)}>{children}</span>
}
