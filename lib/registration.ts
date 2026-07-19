// Registration gate — fail-closed: sign-ups are paused unless
// NEXT_PUBLIC_REGISTRATION_OPEN=1 is set for the environment (see
// .env.example). Shared by the register page (email form + OAuth buttons)
// and the OAuth callback (blocks brand-new accounts while paused) so the
// two can't drift out of sync.
export const REGISTRATION_PAUSED = process.env.NEXT_PUBLIC_REGISTRATION_OPEN !== '1'
