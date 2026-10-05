# ShortLink

A full-stack URL management and click analytics platform, built as the demo application for a 2-day "DevOps with AWS" workshop. It is intentionally small enough to understand completely, but real enough to deploy and put on a resume.

## What's inside

| Folder | What it is |
|---|---|
| `shortlink-api/` | Node.js 20 + Express 4 + PostgreSQL (`pg`) backend |
| `shortlink-web/` | React 18 + Vite 5 + Tailwind CSS v4 + shadcn/ui frontend |

## Features

- Short links with 7-char base62 codes or custom aliases
- Link lifecycle: expiration, enable/disable, update, delete — expired/disabled links stop redirecting (410)
- Click analytics: referrer, device, browser and OS per click; totals, clicks-over-time, top referrers and breakdowns per link
- Per-link analytics dashboard in the UI, with QR code (generate/download/copy) and link settings
- Collections for organizing links; audit trail of management operations
- Rate limiting (env-configurable), Helmet, standardized error codes, OpenAPI docs at `/api/docs`

## Quick start

Requires Node.js 20+ and a local PostgreSQL server.

```bash
git clone https://github.com/Amaan-Khan14/shortlink.git
cd shortlink

# backend
cd shortlink-api
npm install
cp .env.example .env       # set DATABASE_URL
npm run db:init            # apply the schema (idempotent)
npm run dev                # http://localhost:3000

# frontend (new terminal)
cd ../shortlink-web
npm install
npm run dev                # http://localhost:5173 (proxies /api to :3000)
```

## Testing and builds

```bash
cd shortlink-api && npm test    # 36 tests, no database needed
cd shortlink-web && npm test    # 23 tests, no backend needed
cd shortlink-web && npm run build
```

## Documentation

- API reference: run the backend and open http://localhost:3000/api/docs (Swagger UI), or see `shortlink-api/src/docs/openapi.js`
- Backend architecture and database schema: `shortlink-api/README.md`
- Frontend structure and theming: `shortlink-web/README.md`

The AWS deployment and CI/CD phases of the workshop build on this application.
