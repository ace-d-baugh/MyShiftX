import { cn } from '@/lib/utils'

interface PostImageProps {
  src: string
  alt: string
  caption?: string
  className?: string
}

/**
 * A single figure image for use inside a blog post body — the "flare" shots
 * dropped in from /public/posts/[slug]/, distinct from ProductCard's
 * carousel. Not a gallery: one image, optionally captioned.
 */
export function PostImage({ src, alt, caption, className }: PostImageProps) {
  return (
    <figure className={cn('not-prose my-8', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full rounded-lg border border-border object-cover"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-text/45">{caption}</figcaption>
      )}
    </figure>
  )
}
