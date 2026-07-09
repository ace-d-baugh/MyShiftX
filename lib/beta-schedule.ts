// Remnant of the July 2026 beta wind-down: the site-wide lockdown is gone
// (it made every product URL a redirect, which stalled the AdSense review),
// but the feedback survey stays open through this deadline.

/** The survey stays open about a week past the beta close. */
export const SURVEY_CLOSE_AT = new Date('2026-07-11T23:59:00-04:00')

export function isSurveyClosed(): boolean {
  return Date.now() >= SURVEY_CLOSE_AT.getTime()
}
