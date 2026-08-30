import { randomBytes } from 'crypto'

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'board'
  )
}

const SUFFIX_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'
const SUFFIX_LENGTH = 4

// Appended to a slugified name so board URLs stay short and readable while
// being collision-proof at scale — no need to query for taken slugs first.
export function generateSlugSuffix(): string {
  const bytes = randomBytes(SUFFIX_LENGTH)
  let suffix = ''
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    suffix += SUFFIX_ALPHABET[bytes[i] % SUFFIX_ALPHABET.length]
  }
  return suffix
}
