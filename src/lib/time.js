// Relative time via Intl.RelativeTimeFormat, e.g. "3 minutes ago".

const DIVISIONS = [
  ['day', 86400_000],
  ['hour', 3600_000],
  ['minute', 60_000],
]

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function relativeTime(date) {
  const diffMs = new Date(date).getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  if (absMs < 60_000) {
    return formatter.format(Math.round(diffMs / 1000), 'second')
  }
  for (const [unit, ms] of DIVISIONS) {
    if (absMs >= ms) return formatter.format(Math.round(diffMs / ms), unit)
  }
  return formatter.format(0, 'minute')
}
