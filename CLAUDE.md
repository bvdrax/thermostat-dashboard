# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js version

This project runs **Next.js 16 / React 19**. APIs, conventions, and file structure differ from earlier versions. Before writing any code, read the relevant guide in `node_modules/next/dist/docs/`. Key differences from Next.js 14/15:

- `params` in dynamic routes and route handlers is now a **Promise** — always `await params`.
- Tailwind v4 is used — no `tailwind.config.js`; theme tokens are configured via CSS `@theme` blocks.

## Commands

```bash
npm run dev      # dev server on :3000
npm run build    # production build (outputs standalone)
npx tsc --noEmit # type-check only
```

No test runner is configured.

## Architecture

All pages are `"use client"` components — they fetch data directly from the sidecar API in the browser via `useEffect` + `useState`. There are no server-side data fetches in pages.

**Data flow:**
```
Sidecar REST API (http://10.0.0.240:3077)
  → lib/api.ts  (typed fetch wrappers, auto-pagination, numeric coercion)
  → page components (poll/fetch on mount, pass data to chart components)
```

**`lib/api.ts` — critical behaviour:**
- All sidecar responses are passed through coercion functions (`coerceTelemetry`, `coerceSetpointChange`, `coerceRateHistory`) because MariaDB returns numeric columns as strings over JSON. Always go through these helpers; never use raw sidecar responses.
- Pagination: `fetchAll` loops `after_id=next_cursor` until `has_more=false`. `getSetpointChangesPage` is the single-page variant used by the Setpoints audit log.

**`lib/pid.ts` — pure computation, no API calls:**
- `computeAllSuggestions(rows)` — derives Kp/Ti/Td/deadband from rate history via EMA smoothing.
- `detectPreconEvents(rows)` — finds contiguous `precon_active=1` blocks in sorted telemetry and computes delta-at-transition for each.

**Recharts tooltip formatters:**
Recharts v3 passes tooltip values as `string | number | ...`. Always wrap with `Number(val).toFixed(n)` — never cast with `(val as number).toFixed`.

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SIDECAR_URL` | Base URL for sidecar API. Set in `.env.local` for dev, in `docker-compose.yml` for production. |

## Deployment

Production runs as a Docker container on a Synology NAS. `next.config.ts` sets `output: 'standalone'`. Host port `3090` maps to container port `3000`.

```bash
docker-compose up -d --build   # build and start
docker-compose logs -f         # tail logs
```

## CORS

The dashboard fetches the sidecar directly from the browser. If CORS errors appear, the server-side proxy at `app/api/proxy/[...path]/route.ts` can relay requests — update `lib/api.ts` to prefix fetch URLs with `/api/proxy`.
