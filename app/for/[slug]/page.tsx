import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Zap } from 'lucide-react'
import { AnimateIn } from '@/components/landing/AnimateIn'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Footer } from '@/components/landing/Footer'
import { PhotoImportHighlight } from '@/components/landing/PhotoImportHighlight'
import { createServerClient } from '@/lib/supabase/server'
import { optionalServerEnv } from '@/lib/env'
import { INDUSTRIES, getIndustry } from '@/lib/landing/industries'

export function generateStaticParams() {
  return INDUSTRIES.map(i => ({ slug: i.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const industry = getIndustry(params.slug)
  if (!industry) return {}
  return { title: industry.metaTitle, description: industry.metaDescription }
}

export default async function IndustryLandingPage({ params }: { params: { slug: string } }) {
  const industry = getIndustry(params.slug)
  if (!industry) notFound()

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  let displayName: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users').select('display_name').eq('id', user.id).single()
    displayName = profile?.display_name ?? user.email ?? 'Account'
  }

  const otherIndustries = INDUSTRIES.filter(i => i.slug !== industry.slug)

  // Photo Schedule Import marketing appears only where the feature itself is
  // live — same env-var flip that gates the Calendar's Import button.
  const importEnabled = Boolean(optionalServerEnv.GEMINI_API_KEY)

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <LandingHeader displayName={displayName} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-background to-background pt-20 pb-24 px-4">

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl animate-blob" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-secondary/30 blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl animate-blob" style={{ animationDelay: '6s' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">

          <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              {industry.heroKicker}
            </span>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <h1 className="font-accent text-4xl md:text-6xl font-bold text-text mb-6 leading-tight">
              {industry.heroHeadlinePrefix}{' '}
              <span className="text-primary relative inline-block">
                {industry.heroHeadlineHighlight}
                <span
                  className="absolute -bottom-1 left-0 h-[3px] rounded-full bg-gradient-to-r from-primary via-secondary to-primary animate-expand-width"
                  style={{ animationDelay: '850ms' }}
                />
              </span>
            </h1>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            <p className="text-lg md:text-xl text-text/70 max-w-2xl mx-auto mb-10">
              {industry.heroSubcopy}
            </p>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '480ms' }}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn btn-primary text-base px-8 py-3 min-h-0 h-12 gap-2 group">
                Start Trading Shifts
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="btn btn-outline text-base px-8 py-3 min-h-0 h-12">
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain points ── */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <AnimateIn className="text-center mb-14">
            <h2 className="font-accent text-3xl md:text-4xl font-bold text-text mb-4">
              {industry.painPointsIntro}
            </h2>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {industry.painPoints.map((point, i) => (
              <AnimateIn key={point.title} delay={i * 90}>
                <div className="card border-l-4 border-l-warning h-full">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                    <point.icon className="w-5 h-5 text-warning" />
                  </div>
                  <h3 className="font-accent text-lg font-bold text-text mb-2">{point.title}</h3>
                  <p className="text-text/60 text-sm leading-relaxed">{point.body}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solutions ── */}
      <section className="py-20 px-4 bg-primary-light">
        <div className="max-w-6xl mx-auto">
          <AnimateIn className="text-center mb-14">
            <h2 className="font-accent text-3xl md:text-4xl font-bold text-text mb-4">
              {industry.solutionsIntro}
            </h2>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {industry.solutions.map((solution, i) => (
              <AnimateIn key={solution.title} delay={i * 90}>
                <div className="card border-l-4 border-l-primary h-full bg-card">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <solution.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-accent text-lg font-bold text-text mb-2">{solution.title}</h3>
                  <p className="text-text/60 text-sm leading-relaxed">{solution.body}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo Schedule Import highlight (gated with the feature) ── */}
      {importEnabled && <PhotoImportHighlight industryName={industry.shortName} />}

      {/* ── Other industries ── */}
      <section className="py-16 px-4 bg-background overflow-hidden">
        {/* max-w-screen-sm = 640px, the closest Tailwind stop under the 650px design cap */}
        <div className="max-w-screen-sm mx-auto text-center">
          <AnimateIn>
            <p className="text-text/50 text-sm mb-6">Also built for</p>
          </AnimateIn>
          <div className="flex flex-wrap justify-center gap-3">
            {otherIndustries.map((i, idx) => (
              <AnimateIn key={i.slug} animation="fade-in" delay={idx * 70}>
                <Link
                  href={`/for/${i.slug}`}
                  className="inline-block bg-card border border-primary/20 text-text rounded-full px-5 py-2 text-sm font-medium shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-200"
                >
                  {i.shortName}
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-20 px-4 bg-primary">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-blob" />
          <div className="absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-white/5 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <AnimateIn>
            <h2 className="font-accent text-3xl md:text-4xl font-bold text-white mb-4">
              {industry.ctaHeadline}
            </h2>
            <p className="text-white/80 text-lg mb-8">
              {industry.ctaSubcopy}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold rounded-md px-8 py-3 text-base hover:bg-white/90 hover:scale-105 transition-all duration-200 group"
            >
              Create Your Account
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </AnimateIn>
        </div>
      </section>

      <Footer />
    </div>
  )
}
