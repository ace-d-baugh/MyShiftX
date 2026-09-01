/**
 * Shared helpers for carrying a board invite code through the unauthenticated
 * flow (invite link / QR scan → login or register → email verification →
 * onboarding). The code is persisted to localStorage so it survives page
 * navigations and even a different device finishing email verification.
 */
export const PENDING_INVITE_KEY = 'myshiftx-pending-invite'

// 7 = legacy codes, 10 = current — both remain valid.
const CODE_PATTERN = /^[A-Za-z0-9]{7,10}$/

export function readPendingInviteCode(): string | null {
  try {
    return localStorage.getItem(PENDING_INVITE_KEY)
  } catch {
    return null
  }
}

export function savePendingInviteCode(code: string): void {
  if (!CODE_PATTERN.test(code)) return
  try {
    localStorage.setItem(PENDING_INVITE_KEY, code.toUpperCase())
  } catch {}
}

export function clearPendingInviteCode(): void {
  try {
    localStorage.removeItem(PENDING_INVITE_KEY)
  } catch {}
}

/** Reads `code`/`c` directly, or extracts a `c=` embedded in a `redirect` param. */
export function extractInviteCode(searchParams: URLSearchParams): string {
  const direct = searchParams.get('code') ?? searchParams.get('c') ?? ''
  const redirect = searchParams.get('redirect') ?? ''
  const fromRedirect = /[?&]c=([A-Za-z0-9]{7,10})/.exec(redirect)?.[1] ?? ''
  return (direct || fromRedirect).toUpperCase()
}
