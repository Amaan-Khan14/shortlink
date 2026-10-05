const { makeApp, request } = require('./helpers')

// The audit log is written fire-and-forget; give the microtask queue a tick.
const flush = () => new Promise((r) => setImmediate(r))

describe('collections', () => {
  test('creating a link with a collection name creates the collection', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .post('/api/links')
      .send({ url: 'https://example.com', alias: 'lab', collection: 'AWS Workshop' })
    expect(res.status).toBe(201)
    expect(res.body.collection).toEqual({ id: expect.any(Number), name: 'AWS Workshop' })

    const list = await request(app).get('/api/collections')
    expect(list.body).toEqual([
      expect.objectContaining({ name: 'AWS Workshop', linkCount: 1 }),
    ])
  })

  test('two links share one collection; count is correct', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://a.com', alias: 'one', collection: 'Projects' })
    await request(app).post('/api/links').send({ url: 'https://b.com', alias: 'two', collection: 'Projects' })
    const list = await request(app).get('/api/collections')
    expect(list.body[0].linkCount).toBe(2)
  })

  test('POST /api/collections creates; duplicates are 409', async () => {
    const { app } = makeApp()
    const res = await request(app).post('/api/collections').send({ name: 'Talks' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Talks')

    const dup = await request(app).post('/api/collections').send({ name: 'Talks' })
    expect(dup.status).toBe(409)
    expect(dup.body.error.code).toBe('COLLECTION_EXISTS')

    const invalid = await request(app).post('/api/collections').send({ name: '' })
    expect(invalid.status).toBe(400)
  })

  test('deleting a collection detaches its links', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://a.com', alias: 'incol', collection: 'Temp' })
    const cols = await request(app).get('/api/collections')
    const id = cols.body[0].id

    expect((await request(app).delete(`/api/collections/${id}`)).status).toBe(204)
    const link = await request(app).get('/api/links/incol')
    expect(link.body.collection).toBeNull()
    expect((await request(app).delete(`/api/collections/${id}`)).status).toBe(404)
  })

  test('patch can move a link between collections or clear it', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://a.com', alias: 'move', collection: 'A' })
    const moved = await request(app).patch('/api/links/move').send({ collection: 'B' })
    expect(moved.body.collection.name).toBe('B')
    const cleared = await request(app).patch('/api/links/move').send({ collection: '' })
    expect(cleared.body.collection).toBeNull()
  })
})

describe('audit log', () => {
  test('records management operations with resource ids', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'audited' })
    await request(app).patch('/api/links/audited').send({ isEnabled: false })
    await request(app).patch('/api/links/audited').send({ isEnabled: true })
    await request(app).delete('/api/links/audited')
    await flush()

    const res = await request(app).get('/api/audit')
    expect(res.status).toBe(200)
    expect(res.body.map((e) => e.type)).toEqual([
      'link.deleted',
      'link.enabled',
      'link.disabled',
      'link.created',
    ])
    expect(res.body.every((e) => e.resourceType === 'link')).toBe(true)
    expect(res.body.every((e) => e.resourceId === 'audited')).toBe(true)
  })

  test('does not record redirects', async () => {
    const { app } = makeApp()
    await request(app).post('/api/links').send({ url: 'https://example.com', alias: 'silent' })
    await request(app).get('/silent')
    await flush()

    const res = await request(app).get('/api/audit')
    expect(res.body.map((e) => e.type)).toEqual(['link.created'])
  })
})
