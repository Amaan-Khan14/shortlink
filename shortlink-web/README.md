# shortlink-web

The web frontend for ShortLink: a link management and analytics UI. React 18 + Vite 5, Tailwind CSS v4, shadcn/ui. It needs the `shortlink-api` backend running on port 3000.

## Prerequisites

- Node.js 20+
- The backend running on `http://localhost:3000`

## Setup

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

## The dev proxy and `VITE_API_BASE_URL`

In development, Vite proxies `/api` and `/health` to `http://localhost:3000`, so the frontend calls relative URLs and no CORS is needed. `VITE_API_BASE_URL` stays empty unless the API lives on a different origin. The same relative-URL build works unchanged when frontend and API are served from one domain.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with the `/api` + `/health` proxy |
| `npm run build` | Produce a static site in `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm test` | Run the Vitest suite (no network, no backend) |

## Features

- Create links (optional alias and collection), with inline validation
- Links table: status (active/disabled/expired), collection filter, live click counts, 10-second silent auto-refresh
- Per-link analytics dashboard: totals, clicks-over-time chart, device/browser/OS breakdowns, top referrers
- Link settings in the dashboard: edit URL, expiration, collection, enable/disable, delete
- QR code per link, generated client-side: download PNG or copy the image
- Health badge polling every 15 seconds
- Light theme with the Brainfloss design language; full-width layout

## Project layout

- `index.html` — HTML shell (favicon + theme-color links)
- `public/` — `favicon.svg`, PNG favicons, `logo-512.png` mark
- `src/App.jsx` — page shell; owns list state, view switching (list ↔ dashboard), polling
- `src/api.js` — fetch wrapper; standardized `{error:{code,message}}` parsing
- `src/validation.js` — client-side URL/alias checks mirroring the backend
- `src/components/Logo.jsx` — header logo (red slash mark + wordmark)
- `src/components/LinkForm.jsx` — create form
- `src/components/LinkTable.jsx` — links table with filters and row actions
- `src/components/LinkDashboard.jsx` — analytics dashboard + link settings
- `src/components/QrCard.jsx` — client-side QR generation (qrcode package)
- `src/components/BreakdownTable.jsx` — dense breakdown table with inline bars
- `src/components/StatusBadge.jsx` — API health badge
- `src/components/ui/` — shadcn/ui components (incl. `chart` on recharts)
- `src/lib/` — `cn()` helper, relative time, status helpers
- `src/index.css` — Tailwind import and the design tokens
- `src/test/` — Vitest setup and tests

## Design decisions

- Relative URLs plus the dev proxy — no CORS, one build for same-domain deployment.
- shadcn/ui components are copied into the repo; no heavy UI dependency to maintain.
- No router: the dashboard is a view state in `App.jsx`, keeping the app small.
- QR codes are generated entirely client-side (`qrcode`), so short URLs never leave the browser to a third party.
- Chart uses recharts wrapped by the shadcn `chart` component, themed with CSS variables.

## Theming

The app is light-theme only, using the Brainfloss design language confirmed from brainfloss.com: ink `#14100f`, body text `#3a3330`, muted `#f4f4f5` panels, warm `#e4e0de` borders, red `#ff3939` (hover `#d42a2a`), Instrument Sans body with Poppins headings, square cards, 10px buttons and 2px top-border section headings. All tokens live in `src/index.css` as CSS variables mapped to Tailwind through `@theme inline`; change `--primary` in one place and buttons, focus rings and links follow. The layout is full-width with responsive gutters (`px-5 / sm:px-8 / lg:px-12`).
