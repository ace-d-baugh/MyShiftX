// Beta wind-down schedule. America/New_York is UTC-4 (EDT) in July, so
// 11:59 PM ET on July 4th is 03:59 UTC on July 5th.

/** The moment the product goes dark — 11:59 PM ET, Saturday July 4, 2026. */
export const BETA_CLOSE_AT = new Date('2026-07-05T03:59:00Z')

/** The survey stays open about a week past close so feedback keeps coming in. */
export const SURVEY_CLOSE_AT = new Date('2026-07-11T23:59:00-04:00')

export function isBetaClosed(): boolean {
  return Date.now() >= BETA_CLOSE_AT.getTime()
}

export function isSurveyClosed(): boolean {
  return Date.now() >= SURVEY_CLOSE_AT.getTime()
}
