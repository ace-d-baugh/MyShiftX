import Link from 'next/link'
import { Info } from 'lucide-react'

/**
 * The honesty label on every demo page.
 *
 * Not optional and not dismissible. Google's Publisher Policies prohibit
 * "false claims about identity, affiliations, or content purpose", and a page
 * of invented shift posts and invented private messages presented as a real
 * community is squarely that. Saying so plainly also satisfies the AdSense
 * requirement that page content match the site's stated purpose.
 */
export function ShowcaseBanner({ what }: { what: string }) {
  return (
    <div className="rounded-lg border border-info/30 bg-info/10 px-4 py-3 mb-6 flex items-start gap-3">
      <Info className="w-5 h-5 text-info shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm text-text/80 leading-relaxed">
        <span className="font-semibold text-text">Interactive demo.</span>{' '}
        {what} No real people, workplaces, or schedules are shown, and nothing here
        can be posted to or edited.{' '}
        <Link href="/about" className="text-primary hover:underline font-medium">
          Learn how MyShiftX actually works
        </Link>
        .
      </p>
    </div>
  )
}
