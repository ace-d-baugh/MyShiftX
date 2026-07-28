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
  Body: ComponentType
}
