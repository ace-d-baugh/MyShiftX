import type { ComponentType } from 'react'

export interface BlogPost {
  slug: string
  title: string
  /** Used as the meta description and the card blurb on the index. */
  description: string
  /** ISO date. Shown to readers and emitted in the Article JSON-LD. */
  publishedAt: string
  updatedAt: string
  author: string
  tags: string[]
  readingMinutes: number
  /**
   * Local image paths (/products/... or /posts/...). First is used as the
   * card thumbnail on /blog and the hero image on the post page; any
   * further entries are available for inline use within the post body.
   * Omit entirely for a text-only post — the card and hero both fall back
   * gracefully with no image area.
   */
  images?: string[]
  Body: ComponentType
}
