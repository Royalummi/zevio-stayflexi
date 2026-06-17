# Next.js (Public Site) — Agent Instructions

Parent context: see root `AGENTS.md`. Prefer agent: **`/nextjs-public`**.

**Admin/vendor dashboards** are in `../frontend/` — do not implement them here.

## Run

```bash
npm run dev            # port 8000
npm run build
npm run lint
npm test               # vitest
npm run test:e2e       # playwright
```

## Layout

| Path | Purpose |
| --- | --- |
| `app/` | App Router pages (`page.tsx`, layouts, route CSS modules) |
| `components/` | Shared UI (layout, properties, auth modals, home) |
| `lib/api.ts`, `lib/axios.ts` | Backend API client |
| `lib/constants.ts` | API endpoints, app constants |
| `types/` | TypeScript shared types |
| `tests/` | Vitest tests |

## Main routes

- `/` — homepage, search
- `/villas`, `/villas/[id]` — villa listing & detail
- `/service-apartments`, `/service-apartments/[id]`
- `/booking-review`, `/booking-success` — booking flow
- `/dashboard/*` — logged-in user (bookings, profile, favorites, settings)
- Static: `/about`, `/contact`, `/terms`, `/support`, `/destinations`, etc.

## Conventions

1. **App Router** — server/client components as already used on sibling pages.
2. **CSS modules** — colocate `*.module.css` with pages/components; match existing naming.
3. **API** — set `NEXT_PUBLIC_API_URL` (defaults vary in lib files; standard is `http://localhost:5000/api` for local backend).
4. **Types** — extend `types/index.ts` for new API shapes.
5. Trivago-style UX for search and listings; preserve mobile responsiveness.

## Do not

- Modify admin/vendor React app in `../frontend/`.
- Change guest booking UX for channel-manager backend work.
- Hardcode production API URLs — use env vars.

## Migration status

Track progress in repo root:

- `NEXTJS_MIGRATION_TRACKER.md`
- `NEXTJS_DEVELOPMENT_LOG.md`

## Verify locally

1. `npm run dev` → http://localhost:8000
2. Backend running on port 5000
3. Walk the page/flow changed (search → detail → book if applicable)

## Related docs

- `../README.md`
- `../NEXTJS_MIGRATION_TRACKER.md`
