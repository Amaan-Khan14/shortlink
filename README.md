# shortlink-web

The web frontend for ShortLink, a small URL shortener with click counts. It is a single-page React app that talks to the `shortlink-api` backend — the backend must be running on port 3000 for anything to work.

## Prerequisites

- Node.js 20+
- The `shortlink-api` backend running on `http://localhost:3000` (see its README)

## Setup

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

## The dev proxy and `VITE_API_BASE_URL`

In development, Vite proxies `/api` and `/health` to `http://localhost:3000`, so the frontend calls relative URLs and no CORS is needed. `VITE_API_BASE_URL` stays empty unless the API lives on a different origin (then set it to e.g. `https://api.example.com`). The same relative-URL build works unchanged when frontend and API are served from one domain.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with the `/api` + `/health` proxy |
| `npm run build` | Produce a static site in `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm test` | Run the Vitest test suite (no network, no backend) |

## Project layout

- `index.html` — HTML shell
- `vite.config.js` — Vite + Tailwind v4 plugin, `@` alias, dev proxy, Vitest config
- `jsconfig.json` — `@` -> `src` path alias for editors
- `components.json` — shadcn/ui configuration (JavaScript variant)
- `src/main.jsx` — React entry, dark-mode bootstrap
- `src/App.jsx` — page layout; owns links state and the refresh loop
- `src/api.js` — fetch wrapper (`listLinks`, `createLink`, `getHealth`)
- `src/validation.js` — client-side URL/alias checks mirroring the backend
- `src/components/LinkForm.jsx` — create form with inline validation
- `src/components/LinkTable.jsx` — links table (loading/empty/error states)
- `src/components/StatusBadge.jsx` — API health badge, polled every 15 s
- `src/components/ui/` — shadcn/ui components (button, input, label, table, badge, alert, sonner)
- `src/lib/utils.js` — shadcn `cn()` class helper
- `src/lib/time.js` — relative time via `Intl.RelativeTimeFormat`
- `src/index.css` — Tailwind import and the design tokens
- `src/test/` — Vitest setup and tests

## Design decisions

- **Relative URLs plus a dev proxy** — no CORS anywhere, and the same production build works when the frontend and API share a domain.
- **Tailwind + shadcn/ui** — the components are copied into this repo, so there is no heavy UI dependency to maintain; styling stays plain utility classes.
- **No router or state library** — one page, one `useState`/`useEffect` pair; keeping it small makes it readable in ten minutes.
- **Short URLs come from the API** — `BASE_URL` is a backend concern (it changes per environment), so the frontend always displays `shortUrl` exactly as returned.

## Theming

All design tokens live in `src/index.css` as CSS variables (light in `:root`, dark in `.dark`), mapped to Tailwind through `@theme inline`. The brand red `#FF3939` is `--primary`; change it in one place and the button, focus ring and links follow. Type is Instrument Sans (from brainfloss.com), bundled locally via `@fontsource-variable/instrument-sans`.
