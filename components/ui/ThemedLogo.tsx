import Image from 'next/image'

interface ThemedLogoProps {
  /** Sizing classes (e.g. "h-12 w-auto") applied to both renditions. */
  className: string
  alt?: string
  priority?: boolean
}

/**
 * Full MyShiftX logo that follows the active theme. Light and dark show the
 * gradient artwork; the pro themes (theme-* class on <html>) hide it and show
 * a silhouette tinted via CSS instead — see "Theme-aware logo" in globals.css.
 */
export function ThemedLogo({ className, alt = 'MyShiftX Logo', priority }: ThemedLogoProps) {
  return (
    <>
      <Image
        src="/logos/MyShiftX-Full-Logo-Gradient.svg"
        alt={alt}
        width={5000}
        height={1024}
        priority={priority}
        className={`themed-logo-default ${className}`}
      />
      <span role="img" aria-label={alt} className={`themed-logo-tinted ${className}`} />
    </>
  )
}
