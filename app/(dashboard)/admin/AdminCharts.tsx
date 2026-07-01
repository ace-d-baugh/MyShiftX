'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
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

// List prices from the pricing plan, normalized to a monthly-equivalent value.
// Trial and Free pay nothing in subscription revenue.
const MEMBERSHIP_MONTHLY_PRICE: Record<MembershipFilterKey, number> = {
  free: 0,
  trial: 0,
  monthly: 4.99,
  semi_annual: 26.99 / 6,
  yearly: 47.99 / 12,
}

// No AdSense integration yet — this is a rough placeholder assumption, not
// real ad revenue data. Free-tier users are the only ones shown ads.
const AD_REVENUE_PER_FREE_USER = 0.5

const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' })

function monthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return MONTH_FORMAT.format(new Date(y, m - 1, 1))
}

/** All month keys from the earliest to the latest signup, with no gaps. */
function buildMonthRange(users: UserRow[]): string[] {
  if (users.length === 0) return []
  const keys = users.map(u => monthKey(u.created_at)).sort()
  const [fy, fm] = keys[0].split('-').map(Number)
  const [ly, lm] = keys[keys.length - 1].split('-').map(Number)

  const range: string[] = []
  let y = fy, m = fm
  while (y < ly || (y === ly && m <= lm)) {
    range.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return range
}

const money = (n: number) => `$${n.toFixed(2)}`

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
    const counts = new Map<string, number>()
    for (const u of users) {
      const key = monthKey(u.created_at)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return buildMonthRange(users).map(key => ({ month: monthLabel(key), count: counts.get(key) ?? 0 }))
  }, [users])

  const incomeData = useMemo(() => {
    const byMonth = new Map<string, UserRow[]>()
    for (const u of users) {
      const key = monthKey(u.created_at)
      if (!byMonth.has(key)) byMonth.set(key, [])
      byMonth.get(key)!.push(u)
    }

    let cumMembership = 0
    let cumAds = 0
    return buildMonthRange(users).map(key => {
      for (const u of byMonth.get(key) ?? []) {
        const membershipKey = getMembershipKey(u)
        cumMembership += MEMBERSHIP_MONTHLY_PRICE[membershipKey]
        if (membershipKey === 'free') cumAds += AD_REVENUE_PER_FREE_USER
      }
      return {
        month: monthLabel(key),
        memberships: Math.round(cumMembership * 100) / 100,
        ads: Math.round(cumAds * 100) / 100,
      }
    })
  }, [users])

  const currentMembershipIncome = incomeData.at(-1)?.memberships ?? 0
  const currentAdIncome = incomeData.at(-1)?.ads ?? 0

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

      {/* Estimated income per month */}
      <div className="card">
        <h2 className="font-accent text-lg font-bold text-text mb-1">Estimated Income per Month</h2>
        <p className="text-xs text-text/40 italic mb-4">
          Projected, not actual — memberships use current list pricing ($4.99/mo, $26.99/6mo, $47.99/yr) applied
          since signup; ads assume ${AD_REVENUE_PER_FREE_USER.toFixed(2)}/mo per Free user (no AdSense data yet).
        </p>
        {incomeData.length === 0 ? (
          <p className="text-sm text-text/50 italic text-center py-8">No users yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: 'hsl(var(--color-success))' }} />
                <span className="text-text/70">Memberships:</span>
                <span className="font-medium text-text">{money(currentMembershipIncome)}/mo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: 'hsl(var(--color-accent))' }} />
                <span className="text-text/70">Ads:</span>
                <span className="font-medium text-text">{money(currentAdIncome)}/mo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-text/70">Total:</span>
                <span className="font-bold text-text">{money(currentMembershipIncome + currentAdIncome)}/mo</span>
              </div>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'hsl(var(--color-text) / 0.6)', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--color-border))' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => `$${v}`}
                    tick={{ fill: 'hsl(var(--color-text) / 0.6)', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--color-border))' }}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--color-primary) / 0.1)' }}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: 'hsl(var(--color-text))' }}
                    formatter={(value) => money(Number(value))}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'hsl(var(--color-text))' }} />
                  <Bar dataKey="memberships" name="Memberships" stackId="income" fill="hsl(var(--color-success))" />
                  <Bar dataKey="ads" name="Ads" stackId="income" fill="hsl(var(--color-accent))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
