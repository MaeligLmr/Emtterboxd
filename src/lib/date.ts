// Watch dates are plain days (YYYY-MM-DD), with no time or timezone.

/** Today as YYYY-MM-DD, in the local timezone. */
export function todayIso(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** "16 November 2026" */
export function formatDay(iso: string): string {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** "November 2026" from a YYYY-MM-DD day. */
export function formatMonth(iso: string): string {
  const [y = 0, m = 1] = iso.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

/** Day of the month (1-31) from a YYYY-MM-DD day. */
export function dayOfMonth(iso: string): number {
  return Number(iso.split('-')[2] ?? 1)
}
