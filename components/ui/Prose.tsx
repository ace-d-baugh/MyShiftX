import { cn } from '@/lib/utils'

/**
 * Long-form article typography for the blog, FAQ, and the explanatory copy on
 * the demo pages. Uses child selectors rather than @tailwindcss/typography so
 * we're not adding a dependency for six blog posts, and so the colours come
 * from the existing theme tokens (which the prose plugin's palette wouldn't).
 */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'text-text/75 leading-relaxed',
        '[&>p]:mb-5',
        '[&>h2]:font-accent [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-text [&>h2]:mt-10 [&>h2]:mb-3',
        '[&>h3]:font-accent [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-text [&>h3]:mt-8 [&>h3]:mb-2',
        '[&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul]:space-y-2',
        '[&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&>ol]:space-y-2',
        '[&_strong]:text-text [&_strong]:font-semibold',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80',
        '[&>blockquote]:border-l-4 [&>blockquote]:border-primary/30 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-text/60 [&>blockquote]:my-6',
        className
      )}
    >
      {children}
    </div>
  )
}
