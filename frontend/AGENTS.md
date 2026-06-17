# Frontend (Admin/Vendor Dashboard) — Agent Instructions

Parent context: see root `AGENTS.md`. Prefer agent: **`/react-dashboard`**.

**This is not the customer site** — public booking UX lives in `../nextjs/`.

## Run

```bash
npm run dev            # Vite, port 3000
npm run build
npm test               # vitest
npm run test:e2e       # playwright
```

## Layout

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | Routes, protected routes, role gates |
| `src/pages/admin/` | Admin screens |
| `src/pages/vendor/` | Vendor screens |
| `src/components/ui/` | Shadcn UI primitives |
| `src/components/admin/` | Admin-specific forms, modals |
| `src/components/vendor/` | Vendor property/booking UI |
| `src/components/shared/` | Cross-role components (e.g. CM sync logs table) |
| `src/store/` | Zustand (auth, theme) |
| `src/test/` | Vitest tests |

## Roles and routes

- **Admin** — `/admin/*` (properties, users, bookings, refunds, settlements, reports, CM mappings & sync logs)
- **Vendor** — `/vendor/*` (properties, bookings, calendar pricing, analytics, CM sync logs)
- Auth: `useAuthStore`; `ProtectedRoute` with `allowedRoles`

## Conventions

1. Reuse Shadcn components from `components/ui/` before adding new primitives.
2. Mirror patterns from the closest existing admin or vendor page (data fetch, tables, dialogs).
3. API calls via axios — follow existing service/API patterns in the page you are extending.
4. CM UI scope only: connections, sync logs, rate-lock indicators — no guest booking changes.

## Do not

- Change customer-facing pages in `../nextjs/`.
- Remove or weaken role-based route protection.
- Add CM features that alter guest checkout or public property browse.

## Key CM pages

- `src/pages/admin/AdminChannelManagerMappings.jsx`
- `src/pages/admin/AdminChannelManagerSyncLogs.jsx`
- `src/pages/vendor/VendorChannelManagerSyncLogs.jsx`
- `src/components/shared/ChannelManagerSyncLogsTable.jsx`

## Verify locally

1. `npm run dev` → http://localhost:3000
2. Log in as admin or vendor
3. Hit the route you changed and confirm API errors surface in UI (toast/alert)

## Related docs

- `README.md` (this folder)
- `../frontend/README.md`
