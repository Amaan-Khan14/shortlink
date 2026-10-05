# ShortLink API

ShortLink is a URL shortener with click counting. This repository contains the backend API: a Node.js/Express service that stores shortened links in Postgres and redirects visitors to the original URL while counting clicks.

## Prerequisites

- Node.js 20+
- A local Postgres server

Create the database (once):

```bash
createdb shortlink
# or from any SQL client: CREATE DATABASE shortlink;
```

## Setup

```bash
npm install
cp .env.example .env   # then edit DATABASE_URL if yours differs
npm run db:init        # applies db/schema.sql
npm run dev            # starts the API with auto-reload on http://localhost:3000
```

For production-style runs without file watching: `npm start`.

## API reference

### Create a short link

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/some/long/path"}'
```

With a custom alias (`3-32` chars of `A-Za-z0-9_-`, not `api`/`health`):

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/docs", "alias": "my-docs"}'
```

Returns `201` with `{ code, url, shortUrl, clicks, createdAt }`. Alias taken -> `409`; bad url/alias -> `400`.

### List links (newest first, max 50)

```bash
curl http://localhost:3000/api/links
```

### Follow a short link

```bash
curl -i http://localhost:3000/my-docs
# -> 302 with Location: https://example.com/docs (and clicks +1)
```

### Health check

```bash
curl http://localhost:3000/health
# -> {"status":"ok"}  (503 {"status":"unhealthy"} if the database is down)
```

## Tests

```bash
npm test
```

Jest + Supertest run against an in-memory fake repo, so no Postgres and no network are needed.

## Project layout

- `src/server.js` — entrypoint: config, pool, repo, listen, graceful shutdown
- `src/app.js` — `createApp(repo)` -> Express app (no listen; used by tests)
- `src/routes.js` — route handlers
- `src/repo.js` — `createRepo(pool)`: all SQL lives here
- `src/config.js` — reads and validates env vars
- `src/code.js` — short code generator + validators
- `db/schema.sql` — table + index, safe to run repeatedly
- `scripts/init-db.js` — applies the schema via `pg` (`npm run db:init`)
- `tests/fakeRepo.js` — in-memory repo with the same interface as `repo.js`
- `tests/api.test.js` — API tests (no database required)
- `requests.http` — ready-made requests for the VS Code REST Client extension

## Design decisions

- **All SQL is isolated in `repo.js`.** The rest of the app depends only on the repo interface, so the test suite swaps in `tests/fakeRepo.js` and runs without any database — fast, hermetic tests on any laptop.
- **Configuration is env-vars only** (no config files, no hardcoded values). The same code runs unchanged against a local Postgres and against a managed database on AWS later; only the environment differs.

## Environment variables

| Var | Required | Default | Notes |
| --- | --- | --- | --- |
| `PORT` | no | `3000` | |
| `DATABASE_URL` | yes | — | e.g. `postgres://user:pass@localhost:5432/shortlink` |
| `DB_SSL` | no | `false` | `true` -> `ssl: { rejectUnauthorized: false }` |
| `BASE_URL` | no | `http://localhost:<PORT>` | used to build the returned `shortUrl` |
