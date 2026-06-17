# Backend — Agent Instructions

Parent context: see root `AGENTS.md`. Prefer agent: **`/backend-api`** (CM work: **`/channel-manager`**).

## Run

```bash
npm start              # production mode, port 5000
npm run dev            # nodemon
npm run test:unit      # vitest unit tests
npm run test:booking-regression
npm run test:cm-inbound
npm run test:cm-sync-logs
```

## Layout

| Path | Purpose |
| --- | --- |
| `server.js` | App entry, route mounting, middleware |
| `src/routes/` | Express routers |
| `src/controllers/` | Request handlers |
| `src/services/` | Business logic (prefer adding logic here) |
| `src/middlewares/` | auth, validator, pagination, upload, CM auth |
| `src/utils/` | response helpers, sanitize, xmlBuilder, r2Storage |
| `src/cron/` | Scheduled jobs |
| `migrations/` | SQL migrations — use **`/db-migration`** before running |
| `scripts/` | One-off validation and CM test scripts |

## API mounts (`server.js`)

- `/api/auth`, `/api/public`, `/api/bookings`, `/api/payments`
- `/api/admin`, `/api/vendor`, `/api/corporate`
- `/api/channel-manager` — XML webhooks (Plan B); use **`/channel-manager`** agent

## Conventions

1. **ESM only** — `import`/`export`, not `require`.
2. Use `sendSuccess` / `sendError` from `src/utils/response.js`.
3. Auth via `src/middlewares/auth.js`; validate with `express-validator` patterns in routes.
4. DB access: mysql2/promise pool from `src/config/database.js`.
5. New CM logic → services/adapters, not fat controllers.

## Do not

- Break booking, payment, or public API contracts.
- Run migrations without user confirming backup, DB name, and scope.
- Put Stayflexi-specific branching in generic controllers.

## CM scripts (when validating)

```bash
npm run test:cm-inbound
npm run test:cm-sync-logs
npm run run:cm-outbound-validation:mock
npm run check:cm-outbound-readiness
```

## Related docs

- `../docs/deployment/DB_MIGRATION_ROLLBACK.md`
- `../.vscode/copilot-instructions.md` (channel manager)
- `../docs/integration/STAYFLEXI_XML_INTEGRATION_PLAN.md`
