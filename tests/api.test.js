const request = require('supertest');
const { createApp } = require('../src/app');
const { createFakeRepo } = require('./fakeRepo');

const BASE = 'http://sl.test';

function makeApp() {
  const repo = createFakeRepo();
  return { app: createApp(repo, BASE), repo };
}

describe('POST /api/links', () => {
  test('creates a link with a generated 7-char code', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/api/links')
      .send({ url: 'https://example.com/a/long/path' });

    expect(res.status).toBe(201);
    expect(res.body.code).toMatch(/^[A-Za-z0-9]{7}$/);
    expect(res.body.url).toBe('https://example.com/a/long/path');
    expect(res.body.shortUrl).toBe(`${BASE}/${res.body.code}`);
    expect(res.body.clicks).toBe(0);
    expect(res.body.createdAt).toBeTruthy();
  });

  test('creates a link with a custom alias', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/api/links')
      .send({ url: 'https://example.com/docs', alias: 'my-docs_1' });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe('my-docs_1');
  });

  test.each([
    [{ url: 'not a url' }, 'unparseable'],
    [{ url: 'ftp://example.com/file' }, 'non-http scheme'],
    [{ url: 'https://example.com/' + 'a'.repeat(2048) }, 'too long'],
    [{}, 'missing url'],
    [{ url: 'https://example.com', alias: 'ab' }, 'alias too short'],
    [{ url: 'https://example.com', alias: 'has space!' }, 'alias bad chars'],
    [{ url: 'https://example.com', alias: 'api' }, 'reserved alias'],
    [{ url: 'https://example.com', alias: 'health' }, 'reserved alias'],
  ])('returns 400 for %s', async (body) => {
    const { app } = makeApp();
    const res = await request(app).post('/api/links').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  test('returns 409 when the alias is already in use', async () => {
    const { app } = makeApp();
    await request(app).post('/api/links').send({ url: 'https://a.com', alias: 'taken1' });
    const res = await request(app)
      .post('/api/links')
      .send({ url: 'https://b.com', alias: 'taken1' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('alias already in use');
  });
});

describe('GET /api/links', () => {
  test('lists links newest first', async () => {
    const { app } = makeApp();
    await request(app).post('/api/links').send({ url: 'https://first.com', alias: 'first1' });
    await request(app).post('/api/links').send({ url: 'https://second.com', alias: 'secon1' });

    const res = await request(app).get('/api/links');

    expect(res.status).toBe(200);
    expect(res.body.map((l) => l.code)).toEqual(['secon1', 'first1']);
  });
});

describe('GET /:code', () => {
  test('redirects 302 and increments clicks', async () => {
    const { app } = makeApp();
    await request(app).post('/api/links').send({ url: 'https://example.com/x', alias: 'redir1' });

    const res = await request(app).get('/redir1');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/x');

    const list = await request(app).get('/api/links');
    expect(list.body[0].clicks).toBe(1);
  });

  test('returns 404 for an unknown code', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/nope42');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not found');
  });
});

describe('GET /health', () => {
  test('returns 200 when the repo is healthy', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });

  test('returns 503 when the repo ping fails', async () => {
    const { app, repo } = makeApp();
    repo.healthy = false;
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'unhealthy', database: 'down' });
  });
});

describe('GET /', () => {
  test('returns service info', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'shortlink-api', status: 'running' });
  });
});
