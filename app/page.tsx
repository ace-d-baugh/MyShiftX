import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, RefreshCw, Gift, Clock, Shield, Users, Zap } from 'lucide-react'
import { AnimateIn } from '@/components/landing/AnimateIn'

export const metadata = {
  title: 'WDWShiftX – Shift Trading for Disney Cast Members',
  description:
    'The smarter way for Disney Cast Members to trade, giveaway, and request shifts. Fast, safe, and built for the magic.',
}

const features = [
  {
    icon: RefreshCw,
    title: 'Shift Trading Board',
    description:
      'Browse and post shift offers in real-time. Filter by property, location, and role. Trades and giveaways clearly labeled.',
    border: 'border-l-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: Gift,
    title: 'Request Board',
    description:
      'Need a specific date off? Post a shift request and let other CMs reach out. Set preferred morning, afternoon, evening, or late time blocks.',
    border: 'border-l-info',
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
  },
  {
    icon: Zap,
    title: 'Smart Filtering',
    description:
      "Filter shifts by your proficiency locations and roles. Only see what's relevant to you across all six Disney World properties.",
    border: 'border-l-success',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    icon: Clock,
    title: 'Auto-Expiry',
    description:
      'Shift posts automatically expire 30 minutes before the shift starts. Request posts expire at end of day. No stale listings.',
    border: 'border-l-accent',
    iconBg: 'bg-accent/20',
    iconColor: 'text-text',
  },
  {
    icon: Shield,
    title: 'CM Verification',
    description:
      'Cast Member credentials verified at registration — never stored. Only real Cast Members can access the platform.',
    border: 'border-l-warning',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  {
    icon: Users,
    title: 'CM Community',
    description:
      'Built for CMs, by CMs. Leader oversight, flagging system, and moderation tools keep the board clean and trustworthy.',
    border: 'border-l-secondary',
    iconBg: 'bg-secondary/30',
    iconColor: 'text-primary',
  },
]

const properties = [
  'Magic Kingdom',
  'EPCOT',
  'Hollywood Studios',
  'Animal Kingdom',
  'Disney Springs',
  'Resorts',
  'WaterParks',
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border animate-slide-down">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between">
          <Link href="/board" className="flex flex-row items-center gap-0 align-baseline">
            <h1 className="font-accent text-5xl font-bold text-primary leading-tight align-middle">WDW</h1>
            <Image
              src="/logos/ShiftX-logo.svg"
              alt="WDWShiftX Logo"
              width={120}
              height={40}
              priority
              className="h-10" 
              style={{ width: 'auto' }}
            />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="btn btn-outline text-sm px-4 py-2 min-h-0 h-10">
              Log In
            </Link>
            <Link href="/register" className="btn btn-primary text-sm px-4 py-2 min-h-0 h-10">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-background to-background pt-20 pb-24 px-4">

        {/* Animated background blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl animate-blob"
          />
          <div
            className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-secondary/30 blur-3xl animate-blob"
            style={{ animationDelay: '3s' }}
          />
          <div
            className="absolute top-1/2 left-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl animate-blob"
            style={{ animationDelay: '6s' }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">

          {/* Badge */}
          <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Built for Disney Cast Members
            </span>
          </div>

          {/* Headline */}
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <h1 className="font-accent text-4xl md:text-6xl font-bold text-text mb-6 leading-tight">
              Shift Trading,{' '}
              <span className="text-primary relative inline-block">
                Made Magical
                {/* Animated underline draws after the headline appears */}
                <span
                  className="absolute -bottom-1 left-0 h-[3px] rounded-full bg-gradient-to-r from-primary via-secondary to-primary animate-expand-width"
                  style={{ animationDelay: '850ms' }}
                />
              </span>
            </h1>
          </div>

          {/* Sub-copy */}
          <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            <p className="text-lg md:text-xl text-text/70 max-w-2xl mx-auto mb-10">
              WDWShiftX is the fast, safe, and CM-verified platform for trading, giving away,
              and requesting shifts at Walt Disney World. Ditch the chaos.
            </p>
          </div>

          {/* CTAs */}
          <div className="animate-fade-in-up" style={{ animationDelay: '480ms' }}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="btn btn-primary text-base px-8 py-3 min-h-0 h-12 gap-2 group"
              >
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

      {/* ── Features ── */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">

          <AnimateIn className="text-center mb-14">
            <h2 className="font-accent text-3xl md:text-4xl font-bold text-text mb-4">
              Shift Happens. We Handle It.
            </h2>
            <p className="text-text/60 text-lg max-w-xl mx-auto">
              A complete shift management solution designed specifically for Cast Members.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <AnimateIn key={feature.title} delay={i * 90}>
                <div
                  className={`card border-l-4 ${feature.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group h-full`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${feature.iconBg} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-accent text-xl font-bold text-text mb-2">{feature.title}</h3>
                  <p className="text-text/60 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Properties ── */}
      <section className="py-16 px-4 bg-primary-light overflow-hidden">
        <div className="max-w-2xl mx-auto text-center">
          <AnimateIn>
            <h2 className="font-accent text-2xl md:text-3xl font-bold text-text mb-3">
              All Properties Covered
            </h2>
            <p className="text-text/60 mb-8">Find shifts across every park and resort area.</p>
          </AnimateIn>
          <div className="flex flex-wrap justify-center gap-3">
            {properties.map((p, i) => (
              <AnimateIn key={p} animation="fade-in" delay={i * 70}>
                <span className="bg-card border border-primary/20 text-text rounded-full px-5 py-2 text-sm font-medium shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-default">
                  {p}
                </span>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-20 px-4 bg-primary">
        {/* Subtle blob behind the CTA text */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-blob" />
          <div className="absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-white/5 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <AnimateIn>
            <h2 className="font-accent text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Simplify Your Schedule?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Join the WDWShiftX community today.
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

      {/* ── Footer ── */}
      <footer className="bg-[#2F2040] text-white/60 py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-row items-center gap-0 align-baseline">
              <span className="font-accent text-5xl font-bold text-white/60 leading-tight align-middle">WDW</span>
              <Image
                src="/logos/ShiftX-new.svg"
                alt="WDWShiftX"
                width={100}
                height={32}
                className="h-8 brightness-0 invert opacity-60"
                style={{ width: 'auto' }}
              />
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/login" className="hover:text-white transition-colors">Log In</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 text-xs text-center text-white/40">
            <p>
              WDWShiftX is not affiliated with, authorized by, endorsed by, or in any way officially
              connected with The Walt Disney Company, Disney Enterprises, Inc., or any of its
              subsidiaries or affiliates. All Disney trademarks and intellectual property are
              property of their respective owners.
            </p>
            <p className="mt-2">© {new Date().getFullYear()} WDWShiftX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
