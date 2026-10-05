// Analytics shaping: the repository returns raw aggregate rows; this layer
// zero-fills the daily timeline so charts get a continuous series.
function createAnalyticsService({ eventsRepo, linksRepo, maxDays = 90 }) {
  async function getAnalytics(code, days = 30) {
    const clamped = Math.min(Math.max(1, Number(days) || 30), maxDays)
    const link = await linksRepo.getLinkByCode(code)
    if (!link) return null

    const raw = await eventsRepo.getAnalytics(code, clamped)
    const byDay = new Map(raw.timeline.map((row) => [String(row.day), row.clicks]))

    const timeline = []
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    for (let i = clamped - 1; i >= 0; i--) {
      const day = new Date(today.getTime() - i * 86400_000).toISOString().slice(0, 10)
      timeline.push({ date: day, clicks: byDay.get(day) ?? 0 })
    }

    return {
      code: link.code,
      days: clamped,
      totals: {
        clicks: Number(link.clicks),
        recorded: raw.totals.total,
        today: raw.totals.today,
        week: raw.totals.week,
      },
      timeline,
      referrers: raw.referrers,
      devices: raw.devices,
      browsers: raw.browsers,
      operatingSystems: raw.operatingSystems,
    }
  }

  return { getAnalytics }
}

module.exports = { createAnalyticsService }
