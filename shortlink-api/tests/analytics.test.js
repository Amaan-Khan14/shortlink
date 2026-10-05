const { makeApp, request } = require('./helpers')

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const FIREFOX_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0'

async function seedClicks(app, code, clicks) {
  for (const { referer, ua } of clicks) {
    await request(app)
      .get(`/${code}`)
      .set('Referer', referer)
      .set('User-Agent', ua)
  }
}

describe('analytics capture and aggregation', () => {
  test('captures referrer/device/browser/os per click', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'stats' })
    await seedClicks(app, 'stats', [
      { referer: 'https://github.com/pr', ua: CHROME_UA },
      { referer: 'https://github.com/readme', ua: CHROME_UA },
      { referer: '', ua: IPHONE_UA },
      { referer: 'https://google.com/search', ua: FIREFOX_UA },
    ])

    const res = await request(app).get('/api/links/stats/analytics?days=7')
    expect(res.status).toBe(200)

    expect(res.body.totals).toMatchObject({ clicks: 4, recorded: 4, today: 4, week: 4 })

    const byName = (rows) => Object.fromEntries(rows.map((r) => [r.name, r.clicks]))
    expect(byName(res.body.referrers)).toEqual({
      'github.com': 2,
      'google.com': 1,
      Direct: 1,
    })
    expect(byName(res.body.devices)).toEqual({ desktop: 3, mobile: 1 })
    expect(byName(res.body.browsers)).toEqual({ chrome: 2, safari: 1, firefox: 1 })
    expect(byName(res.body.operatingSystems)).toEqual({ macos: 2, ios: 1, windows: 1 })

    // Timeline covers every day in the window, zero-filled.
    expect(res.body.timeline).toHaveLength(7)
    const today = res.body.timeline[res.body.timeline.length - 1]
    expect(today.clicks).toBe(4)
  })

  test('analytics for an unknown link is 404', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/links/nope/analytics')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('LINK_NOT_FOUND')
  })

  test('days is clamped to the configured maximum', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'clamp' })
    const res = await request(app).get('/api/links/clamp/analytics?days=5000')
    expect(res.status).toBe(200)
    expect(res.body.days).toBe(90)
  })

  test('a link with no clicks reports zeroed analytics', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'quiet' })
    const res = await request(app).get('/api/links/quiet/analytics?days=3')
    expect(res.body.totals).toEqual({ clicks: 0, recorded: 0, today: 0, week: 0 })
    expect(res.body.timeline).toHaveLength(3)
    expect(res.body.referrers).toEqual([])
  })
})
