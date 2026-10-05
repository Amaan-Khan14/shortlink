# shortlink-api

The backend for ShortLink: a URL management and click analytics API. Node.js 20, Express 4, PostgreSQL via `pg`. Interactive API docs (Swagger UI) are served at `/api/docs` when the server runs.

## Prerequisites

- Node.js 20+
- A local PostgreSQL server. Create the database once: `createdb shortlink` (or via any SQL client).

## Setup

```bash
npm install
cp .env.example .env     # edit DATABASE_URL for your machine
npm run db:init          # applies db/schema.sql (safe to run repeatedly)
npm run dev              # http://localhost:3000, restarts on file changes
```

## Scripts

| Script | What it does |
|---|---|
| `npm start` | Run the server (reads `.env`) |
| `npm run dev` | Run with `--watch` |
| `npm test` | Jest suite — no database, no network |
| `npm run db:init` | Apply `db/schema.sql` |

## Environment variables

| Var | Required | Default | Notes |
|---|---|---|---|
| `PORT` | no | `3000` | |
| `DATABASE_URL` | yes | — | e.g. `postgres://user:pass@localhost:5432/shortlink` |
| `DB_SSL` | no | `false` | `true` for RDS later |
| `BASE_URL` | no | `http://localhost:<PORT>` | builds returned `shortUrl` values |
| `RATE_LIMIT_ENABLED` | no | `true` | set `false` to disable all limiters |
| `RATE_LIMIT_WINDOW_MS` | no | `60000` | per-IP window |
| `RATE_LIMIT_CREATE_MAX` | no | `30` | link creations per window |
| `RATE_LIMIT_REDIRECT_MAX` | no | `240` | redirects per window |
| `RATE_LIMIT_API_MAX` | no | `300` | other `/api` requests per window |
| `ANALYTICS_MAX_DAYS` | no | `90` | max `days` for analytics queries |
| `CORS_ORIGIN` | no | — | comma-separated origins allowed from browsers |

## API overview

| Endpoint | Purpose |
|---|---|
| `POST /api/links` | Create (`url`, optional `alias`, `expiresAt`, `collection`) |
| `GET /api/links` | List, newest first, max 50 |
| `GET /api/links/:code` | Details |
| `PATCH /api/links/:code` | Update `url` / `expiresAt` / `isEnabled` / `collection` |
| `DELETE /api/links/:code` | Delete |
| `GET /api/links/:code/analytics?days=30` | Totals, timeline, referrers, devices, browsers, OS |
| `GET /:code` | 302 redirect + atomic click increment; `410` when expired/disabled |
| `GET /api/collections`, `POST`, `DELETE /api/collections/:id` | Grouping |
| `GET /api/audit?limit=50` | Recent management events |
| `GET /health` | Liveness + DB check (for load balancers) |
| `GET /ready` | Readiness + uptime |

Errors are standardized: `{ "error": { "code": "LINK_NOT_FOUND", "message": "..." } }` with stable codes (`VALIDATION_ERROR`, `ALIAS_TAKEN`, `LINK_EXPIRED`, `LINK_DISABLED`, `RATE_LIMITED`, ...). `requests.http` has ready-made requests for every endpoint.

## Architecture

```
src/
├── server.js            # entrypoint: config, pool, wiring, graceful shutdown
├── app.js               # createApp(services, options) — middleware + mounting
├── config.js            # env reading and validation
├── routes/              # HTTP concerns: parse, delegate, status codes
├── services/            # business logic (links, analytics, collections, audit)
├── repositories/        # ALL SQL lives here (pg only, no ORM)
├── middleware/          # error handler, request logger, rate limiters
├── utils/               # errors, DTO mapping, UA classification, code gen
└── docs/openapi.js      # OpenAPI 3 spec served at /api/docs
```

The layering rule: **routes never touch SQL, repositories never touch HTTP.** Tests (`tests/`) construct the real services over in-memory fakes (`tests/fakes.js`) so all 36 tests run with no database.

## Database schema

```
collections (id, name UNIQUE, created_at)
links       (id, code UNIQUE, url, clicks, created_at, expires_at, is_enabled, collection_id → collections)
link_events (id, link_id → links ON DELETE CASCADE, occurred_at, referrer, device, browser, operating_system)
audit_logs  (id, event_type, resource_type, resource_id, metadata JSONB, created_at)
```

- `links.clicks` stays the fast aggregate counter; `link_events` stores per-click detail.
- Indexes: `links(created_at DESC)`, `links(collection_id)`, `link_events(link_id, occurred_at DESC)`, `link_events(link_id, referrer)`, `audit_logs(created_at DESC)`.
- Privacy: only coarse UA categories are stored (device/browser/OS), never raw user-agent strings or IPs.

## Design decisions

- SQL isolated in repositories so tests run database-free.
- Redirects use one transactional indexed UPDATE + INSERT; classification (404 vs expired vs disabled) happens in SQL.
- Rate limits and every environment input are env-configurable — the same code runs locally and on AWS later.
- Analytics store no cookies or fingerprints; "unique visitors" is deliberately not estimated.
