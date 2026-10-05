const { makeApp, request } = require('./helpers')

describe('GET /health', () => {
  test('returns 200 with database up when the repo is healthy', async () => {
    const { app } = makeApp({ healthy: true })
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', database: 'up' })
  })

  test('returns 503 when ping fails', async () => {
    const { app } = makeApp({ healthy: false })
    const res = await request(app).get('/health')
    expect(res.status).toBe(503)
    expect(res.body).toEqual({ status: 'unhealthy', database: 'down' })
  })
})

describe('GET /ready', () => {
  test('reports readiness and uptime when the database is up', async () => {
    const { app } = makeApp({ healthy: true })
    const res = await request(app).get('/ready')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ready')
    expect(res.body.checks).toEqual({ database: 'up' })
    expect(typeof res.body.uptimeSeconds).toBe('number')
  })

  test('returns 503 when the database is down', async () => {
    const { app } = makeApp({ healthy: false })
    const res = await request(app).get('/ready')
    expect(res.status).toBe(503)
    expect(res.body.checks).toEqual({ database: 'down' })
  })
})
