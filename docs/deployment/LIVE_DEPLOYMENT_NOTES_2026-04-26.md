# Live Deployment Notes - 2026-04-26

## Status

- Frontend deployed and rebuilt successfully.
- Next.js deployed and rebuilt successfully.
- Backend restarted successfully under PM2.
- `admin.zevio.in`, `zevio.in`, and `api.zevio.in/health` responded successfully after deployment.

## Production Fixes Applied

- Fixed admin auth pages so they no longer redirect to localhost URLs.
- Updated live nginx `client_max_body_size` from `20M` to `250M` for `api.zevio.in`.
- Created a live nginx backup at `/etc/nginx/sites-available/zevio.in.bak.manual`.

## Nginx Source Of Truth

- `nginx/zevio.conf` in the repo was legacy `zevio.cloud` config.
- The repo file has been updated to match the active `zevio.in` production layout.

## Database Safety Check

- `Database.sql` was deployed as an artifact only.
- The SQL dump matches the uploaded server copy exactly.
- The SQL dump was **not** imported into `zevio_production`.

## Why The Dump Was Not Imported

- Local dump table count: `45`
- Live `zevio_production` table count: `48`
- Live-only tables:
  - `employee_claims`
  - `employee_points`
  - `employees`

Importing `Database.sql` directly into production would risk removing live schema/data that is not present in the dump.

## Recommended Next Step

- Generate a forward-only schema migration from the live database delta instead of restoring `Database.sql` over production.
## Additional Live DB Drift Verified

- Live row counts in the employee drift tables:
  - `employees`: `2`
  - `employee_points`: `0`
  - `employee_claims`: `2`
- Live schema also still includes `properties.employee_id`
- Do not run `backend/migrations/remove_employee_features.sql` blindly on production.
- First export and review the live employee data, then decide whether to preserve, migrate, or remove it with a guarded forward-only migration.
