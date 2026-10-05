const { makeApp, request } = require('./helpers')

describe('rate limiting', () => {
  test('link creation is rate limited with a 429 and stable error body', async () => {
    const { app } = makeApp({
      rateLimit: { enabled: true, windowMs: 60_000, createMax: 2, redirectMax: 240, apiMax: 300 },
    })
    const post = () => request(app).post('/api/links').send({ url: 'https://example.com' })

    expect((await post()).status).toBe(201)
    expect((await post()).status).toBe(201)
    const limited = await post()
    expect(limited.status).toBe(429)
    expect(limited.body.error.code).toBe('RATE_LIMITED')
    expect(limited.body.error.message).toMatch(/link creation/i)
    expect(limited.headers['retry-after']).toBeDefined()
  })

  test('redirects have their own bucket', async () => {
    const { app } = makeApp({
      rateLimit: { enabled: true, windowMs: 60_000, createMax: 30, redirectMax: 2, apiMax: 300 },
    })
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'spam' })
    expect((await request(app).get('/spam')).status).toBe(302)
    expect((await request(app).get('/spam')).status).toBe(302)
    expect((await request(app).get('/spam')).status).toBe(429)
  })

  test('rate limits can be disabled (test default)', async () => {
    const { app } = makeApp() // enabled: false
    for (let i = 0; i < 5; i++) {
      expect((await request(app).post('/api/links').send({ url: 'https://example.com' })).status).toBe(201)
    }
  })
})
