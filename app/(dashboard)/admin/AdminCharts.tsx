'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Star } from 'lucide-react'
import { getMembershipKey, MEMBERSHIP_OPTIONS, type UserRow, type MembershipFilterKey } from './AdminClient'

interface AdminChartsProps {
  users: UserRow[]
}

const MEMBERSHIP_COLOR: Record<MembershipFilterKey, string> = {
  free: 'hsl(var(--color-secondary-accent))',
  trial: 'hsl(var(--color-info))',
  monthly: 'hsl(var(--color-accent))',
  semi_annual: 'hsl(var(--color-primary))',
  yearly: 'hsl(var(--color-success))',
}

const MEMBERSHIP_EMOJI: Partial<Record<MembershipFilterKey, string>> = {
  trial: '⚖️',
  monthly: '📅',
  semi_annual: '🥈',
  yearly: '🏆',
}

const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' })

function monthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return MONTH_FORMAT.format(new Date(y, m - 1, 1))
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--color-card))',
  border: '1px solid hsl(var(--color-border))',
  borderRadius: '0.5rem',
  fontSize: '0.8rem',
}

export function AdminCharts({ users }: AdminChartsProps) {
  const pieData = useMemo(() => {
    const counts: Record<MembershipFilterKey, number> = { free: 0, trial: 0, monthly: 0, semi_annual: 0, yearly: 0 }
    for (const u of users) counts[getMembershipKey(u)]++
    return MEMBERSHIP_OPTIONS.map(o => ({ key: o.key, label: o.label, count: counts[o.key] })).filter(d => d.count > 0)
  }, [users])

  const total = users.length

  const monthlyData = useMemo(() => {
    if (users.length === 0) return []
    const counts = new Map<string, number>()
    for (const u of users) {
      const key = monthKey(u.created_at)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const keys = Array.from(counts.keys()).sort()
    const [fy, fm] = keys[0].split('-').map(Number)
    const [ly, lm] = keys[keys.length - 1].split('-').map(Number)

    const months: { month: string; count: number }[] = []
    let y = fy, m = fm
    while (y < ly || (y === ly && m <= lm)) {
      const key = `${y}-${String(m).padStart(2, '0')}`
      months.push({ month: monthLabel(key), count: counts.get(key) ?? 0 })
      m++
      if (m > 12) { m = 1; y++ }
    }
    return months
  }, [users])

  return (
    <div className="space-y-8">
      {/* Membership pie chart */}
      <div className="card">
        <h2 className="font-accent text-lg font-bold text-text mb-4">Membership Breakdown</h2>
        {total === 0 ? (
          <p className="text-sm text-text/50 italic text-center py-8">No users yet.</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-1/2 h-64 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map(d => (
                      <Cell key={d.key} fill={MEMBERSHIP_COLOR[d.key]} stroke="hsl(var(--color-card))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--color-text))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom legend: emoji, type name, count, total at the bottom */}
            <div className="w-full sm:w-1/2 space-y-1.5">
              {pieData.map(d => (
                <div key={d.key} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: MEMBERSHIP_COLOR[d.key] }} />
                  {d.key === 'free' ? (
                    <Star fill="#ffea80" strokeWidth={0} className="w-4 h-4 rotate-[-30deg] text-[#FFEA80] shrink-0" />
                  ) : (
                    <span className="text-base leading-none shrink-0" role="img" aria-label={d.key}>{MEMBERSHIP_EMOJI[d.key]}</span>
                  )}
                  <span className="text-text/80 flex-1">{d.label}</span>
                  <span className="font-medium text-text">{d.count}</span>
                </div>
              ))}
              <div className="h-px bg-border my-2" />
              <div className="flex items-center justify-between text-sm font-bold text-text">
                <span>Total</span>
                <span>{total}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signups per month bar chart */}
      <div className="card">
        <h2 className="font-accent text-lg font-bold text-text mb-4">Sign-ups per Month</h2>
        {monthlyData.length === 0 ? (
          <p className="text-sm text-text/50 italic text-center py-8">No users yet.</p>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'hsl(var(--color-text) / 0.6)', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--color-border))' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--color-text) / 0.6)', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--color-border))' }}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--color-primary) / 0.1)' }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'hsl(var(--color-text))' }}
                />
                <Bar dataKey="count" name="Sign-ups" fill="hsl(var(--color-primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
