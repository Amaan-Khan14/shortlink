const { makeApp, request } = require('./helpers')

describe('POST /api/links', () => {
  test('creates a link with a generated code', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .post('/api/links')
      .send({ url: 'https://example.com' })
    expect(res.status).toBe(201)
    expect(res.body.code).toMatch(/^[A-Za-z0-9]{7}$/)
    expect(res.body.shortUrl).toBe(`http://localhost:3000/${res.body.code}`)
    expect(res.body.clicks).toBe(0)
    expect(res.body.isEnabled).toBe(true)
    expect(res.body.expiresAt).toBeNull()
    expect(res.body.collection).toBeNull()
  })

  test('creates a link with a custom alias and expiry', async () => {
    const { app } = makeApp()
    const expiresAt = new Date(Date.now() + 3600_000).toISOString()
    const res = await request(app)
      .post('/api/links')
      .send({ url: 'https://example.com', alias: 'launch', expiresAt })
    expect(res.status).toBe(201)
    expect(res.body.code).toBe('launch')
    expect(res.body.expiresAt).toBe(expiresAt)
  })

  test.each([
    [{ url: 'not-a-url' }, 'url is required'],
    [{ url: 'ftp://example.com' }, 'url is required'],
    [{ url: 'https://example.com', alias: 'ab' }, 'alias must be'],
    [{ url: 'https://example.com', alias: 'has space' }, 'alias must be'],
    [{ url: 'https://example.com', alias: 'health' }, 'alias must be'],
    [{ url: 'https://example.com', expiresAt: 'whenever' }, 'expiresAt must be'],
  ])('returns a standardized 400 for %j', async (body, messagePrefix) => {
    const { app } = makeApp()
    const res = await request(app).post('/api/links').send(body)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.message).toMatch(messagePrefix)
  })

  test('duplicate alias returns 409 with a code', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'taken' })
    const res = await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'taken' })
    expect(res.status).toBe(409)
    expect(res.body.error).toEqual({ code: 'ALIAS_TAKEN', message: 'alias already in use' })
  })
})

describe('GET /api/links', () => {
  test('lists newest first', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com/a', alias: 'older' })
    await new Promise((r) => setTimeout(r, 5))
    await request(app).post('/api/links').send({ url: 'https://example.com/b', alias: 'newer' })
    const res = await request(app).get('/api/links')
    expect(res.status).toBe(200)
    expect(res.body.map((l) => l.code)).toEqual(['newer', 'older'])
  })
})

describe('link lifecycle', () => {
  test('get /api/links/:code returns details; unknown code is 404', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'detail' })
    const ok = await request(app).get('/api/links/detail')
    expect(ok.status).toBe(200)
    expect(ok.body.url).toBe('https://example.com')

    const missing = await request(app).get('/api/links/nope')
    expect(missing.status).toBe(404)
    expect(missing.body.error.code).toBe('LINK_NOT_FOUND')
  })

  test('patch updates url and clears expiry', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({
      url: 'https://example.com',
      alias: 'patchme',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    })
    const res = await request(app)
      .patch('/api/links/patchme')
      .send({ url: 'https://example.com/updated', expiresAt: null })
    expect(res.status).toBe(200)
    expect(res.body.url).toBe('https://example.com/updated')
    expect(res.body.expiresAt).toBeNull()
  })

  test('delete removes the link', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'gone' })
    expect((await request(app).delete('/api/links/gone')).status).toBe(204)
    expect((await request(app).get('/api/links/gone')).status).toBe(404)
    expect((await request(app).delete('/api/links/gone')).status).toBe(404)
  })
})

describe('GET /:code redirect lifecycle', () => {
  test('redirects 302 and increments clicks', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'redir' })
    const res = await request(app).get('/redir')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('https://example.com')
    const list = await request(app).get('/api/links')
    expect(list.body.find((l) => l.code === 'redir').clicks).toBe(1)
  })

  test('unknown code is 404 with LINK_NOT_FOUND', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('LINK_NOT_FOUND')
  })

  test('disabled link returns 410 LINK_DISABLED and does not redirect', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'off' })
    await request(app).patch('/api/links/off').send({ isEnabled: false })
    const res = await request(app).get('/off')
    expect(res.status).toBe(410)
    expect(res.body.error.code).toBe('LINK_DISABLED')
    const list = await request(app).get('/api/links')
    expect(list.body.find((l) => l.code === 'off').clicks).toBe(0)
  })

  test('expired link returns 410 LINK_EXPIRED', async () => {
    const { app } = makeApp()
    const expired = new Date(Date.now() - 1000).toISOString()
    await request(app).post('/api/links').send({
      url: 'https://example.com', alias: 'old', expiresAt: expired,
    })
    const res = await request(app).get('/old')
    expect(res.status).toBe(410)
    expect(res.body.error.code).toBe('LINK_EXPIRED')
  })
})

describe('GET /', () => {
  test('returns service info', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ name: 'shortlink-api', status: 'running' })
  })
})
