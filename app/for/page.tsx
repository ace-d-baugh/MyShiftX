import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { AnimateIn } from '@/components/landing/AnimateIn'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Footer } from '@/components/landing/Footer'
import { PhotoImportHighlight } from '@/components/landing/PhotoImportHighlight'
import { createServerClient } from '@/lib/supabase/server'
import { optionalServerEnv } from '@/lib/env'
import { INDUSTRIES } from '@/lib/landing/industries'
import { SHOWCASE_MODE } from '@/lib/showcase/mode'

export const metadata = {
  // The root layout appends " – MyShiftX" via its title template.
  title: 'Industries We Support – Shift Swapping by Workplace',
  description:
    'How shift trading actually works in retail, restaurants, warehouses, hotels, theme parks, and event venues — the scheduling problems each one has, and what MyShiftX does about them.',
}

/**
 * One page covering every industry, replacing the six /for/[slug] pages.
 *
 * Those pages shared a single template with the nouns swapped, which is the
 * shape Google's spam systems classify as doorway pages — and that citation is
 * exactly what the AdSense rejection named. The per-industry copy was never the
 * problem, so it all survives here; what's gone is the six near-identical URLs
 * funnelling to the same signup. Old /for/:slug URLs permanently redirect here
 * (see next.config.mjs) so nothing that was indexed 404s.
 */
export default async function IndustriesPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  let displayName: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users').select('display_name').eq('id', user.id).single()
    displayName = profile?.display_name ?? user.email ?? 'Account'
  }

  // Photo Schedule Import marketing appears only where the feature itself is
  // live — same env-var flip that gates the Calendar's Import button.
  const importEnabled = Boolean(optionalServerEnv.GEMINI_API_KEY)

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <LandingHeader displayName={displayName} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-background to-background pt-20 pb-16 px-4">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl animate-blob" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-secondary/30 blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Six industries, one board
            </span>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <h1 className="font-accent text-4xl md:text-5xl font-bold text-text mb-6 leading-tight">
              Industries We{' '}
              <span className="text-primary relative inline-block">
                Support
                <span
                  className="absolute -bottom-1 left-0 h-[3px] rounded-full bg-gradient-to-r from-primary via-secondary to-primary animate-expand-width"
                  style={{ animationDelay: '850ms' }}
                />
              </span>
            </h1>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            <p className="text-lg text-text/70 mb-8">
              Every shift-based workplace breaks in its own particular way. A clopening is not a
              mandatory-overtime week, and neither is a ride you are not signed off to run. Here is
              what scheduling actually looks like in each one — and the part of MyShiftX built for it.
            </p>
          </div>

          {/* Jump nav — a real table of contents, so this page is navigable
              rather than a wall of sections. */}
          <div className="animate-fade-in-up" style={{ animationDelay: '480ms' }}>
            <nav aria-label="Jump to an industry" className="flex flex-wrap justify-center gap-2">
              {INDUSTRIES.map(industry => (
                <a
                  key={industry.slug}
                  href={`#${industry.slug}`}
                  className="inline-block bg-card border border-primary/20 text-text rounded-full px-4 py-2 text-sm font-medium shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-200"
                >
                  {industry.shortName}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* ── What every one of them has in common ── */}
      <section className="py-16 px-4 bg-background border-b border-border">
        <div className="max-w-3xl mx-auto">
          <AnimateIn>
            <h2 className="font-accent text-2xl md:text-3xl font-bold text-text mb-4">
              The same broken loop, everywhere
            </h2>
            <div className="space-y-4 text-text/70 leading-relaxed">
              <p>
                Someone needs a shift covered. They post it into a group chat with forty people in
                it, or text six coworkers one at a time, or write it on a printout by the time clock.
                Then they wait. The people who actually wanted those hours never saw the message,
                and the ones who saw it cannot work that day anyway.
              </p>
              <p>
                MyShiftX replaces that loop with a board. You post a shift once, everyone qualified
                to take it sees it, and the trade gets settled in the open where nothing is buried
                or double-booked. That much is identical whether you are running a register or a
                roller coaster.
              </p>
              <p>
                What differs is the constraint on top — who is allowed to take your shift, how much
                notice you get, and what it costs you if nobody does. That is what the rest of this
                page is about.
              </p>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── Per-industry sections ── */}
      {INDUSTRIES.map((industry, index) => (
        <section
          key={industry.slug}
          id={industry.slug}
          className={`py-16 px-4 scroll-mt-20 ${index % 2 === 0 ? 'bg-background' : 'bg-primary-light'}`}
        >
          <div className="max-w-5xl mx-auto">
            <AnimateIn>
              <div className="flex items-baseline gap-3 flex-wrap mb-3">
                <h2 className="font-accent text-2xl md:text-3xl font-bold text-text">
                  {industry.shortName}
                </h2>
                <span className="text-sm text-text/50 font-medium">{industry.heroKicker}</span>
              </div>
              <p className="text-text/70 leading-relaxed max-w-3xl mb-10">
                {industry.heroSubcopy}
              </p>
            </AnimateIn>

            {/* Problem and answer side by side, so each pain point sits next to
                what addresses it rather than in two disconnected card grids. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AnimateIn>
                <h3 className="font-accent text-sm font-bold uppercase tracking-wide text-warning mb-4">
                  What you&apos;re dealing with
                </h3>
                <ul className="space-y-5">
                  {industry.painPoints.map(point => (
                    <li key={point.title} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                        <point.icon className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <h4 className="font-accent font-bold text-text text-[15px] mb-1">{point.title}</h4>
                        <p className="text-text/60 text-sm leading-relaxed">{point.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </AnimateIn>

              <AnimateIn delay={90}>
                <h3 className="font-accent text-sm font-bold uppercase tracking-wide text-primary mb-4">
                  What MyShiftX does about it
                </h3>
                <ul className="space-y-5">
                  {industry.solutions.map(solution => (
                    <li key={solution.title} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <solution.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-accent font-bold text-text text-[15px] mb-1">{solution.title}</h4>
                        <p className="text-text/60 text-sm leading-relaxed">{solution.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </AnimateIn>
            </div>

            <AnimateIn delay={150}>
              <p className="mt-8 text-sm text-text/50">
                Commonly used alongside {industry.scheduleApps.join(', ')}.
              </p>
            </AnimateIn>
          </div>
        </section>
      ))}

      {/* ── Not listed? ── */}
      <section className="py-16 px-4 bg-background border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <AnimateIn>
            <h2 className="font-accent text-2xl font-bold text-text mb-3">
              Don&apos;t see your workplace?
            </h2>
            <p className="text-text/70 leading-relaxed">
              Boards are workplace-agnostic. Nothing about MyShiftX is hard-coded to these six —
              they are just the ones we have heard the most from. If your job runs on fixed shifts
              and a schedule someone else writes, a board will work for it. Hospitals, call centers,
              grocery, security, transit, cinemas: same board, your roles.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── Photo Schedule Import highlight (gated with the feature) ── */}
      {importEnabled && <PhotoImportHighlight />}

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-20 px-4 bg-primary">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-blob" />
          <div className="absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-white/5 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <AnimateIn>
            <h2 className="font-accent text-3xl md:text-4xl font-bold text-white mb-4">
              {SHOWCASE_MODE
                ? 'See how a trade actually gets settled.'
                : 'Stop chasing coverage. Start posting it.'}
            </h2>
            <p className="text-white/80 text-lg mb-8">
              {SHOWCASE_MODE
                ? 'Walk through the Wall, the calendar, and a shift changing hands — no account needed.'
                : 'Free to join, whatever you do. Set up your board in minutes.'}
            </p>
            <Link
              href={SHOWCASE_MODE ? '/wall' : '/register'}
              className="inline-flex items-center gap-2 bg-white text-primary font-bold rounded-md px-8 py-3 text-base hover:bg-white/90 hover:scale-105 transition-all duration-200 group"
            >
              {SHOWCASE_MODE ? 'Explore the Demo' : 'Create Your Account'}
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </AnimateIn>
        </div>
      </section>

      <Footer />
    </div>
  )
}
