# Zevio — Cursor Agent Instructions

This file gives Cursor agents the same project context that lives in `.vscode/copilot-instructions.md`.

## Project layout

Nested `AGENTS.md` files add folder-specific context when you work inside each app:

| App | Path | Nested instructions |
| --- | --- | --- |
| Backend API | `backend/` | `backend/AGENTS.md` |
| React dashboard | `frontend/` | `frontend/AGENTS.md` |
| Next.js public site | `nextjs/` | `nextjs/AGENTS.md` |

| App | Path | Port | Purpose |
| --- | --- | --- | --- |
| Backend API | `backend/` | 5000 | Express + MySQL REST API |
| React dashboard | `frontend/` | 3000 (Vite dev) | Admin & vendor management |
| Next.js public site | `nextjs/` | 8000 | Customer-facing booking site |

**Stack:** Node.js ESM, Express, mysql2/promise, React 19 + Vite, Next.js + TypeScript, JWT auth.

## Before you change anything

1. Do not break booking, payments, public property browsing, vendor dashboard, or admin workflows.
2. Keep schema changes additive and backward compatible.
3. Never run destructive or schema-changing SQL without explicit user confirmation in the same session.
4. Prefer small, focused diffs — no broad refactors unrelated to the active task.

## Channel manager (Plan B)

Active work follows **Plan B**: multi-channel foundation, **XML-first**, Stayflexi as first provider but **provider-generic** design.

**Mandatory reading for channel-manager tasks:**

- `.vscode/copilot-instructions.md` — safety, architecture, and delivery rules
- `.vscode/CHANNEL_MANAGER_PLAN_B_STEP_BY_STEP.md` — phased execution plan
- `docs/tracking/CHANNEL_MANAGER_PROGRESS_LOG.md` — current progress

**Key rules:**

- Mount new CM endpoints under `/api/channel-manager`
- Use `provider_key` abstraction; keep provider logic in adapters/services
- Target DB for Plan B rollout: `zevio_stayflexi` (not production unless user overrides)
- Keep `CHANNEL_MANAGER_ENABLED=false` until inbound/outbound validation is complete
- Complete one Plan B phase before opening broad work on the next

## Documentation map

| Topic | Location |
| --- | --- |
| Quick start & architecture | `README.md` |
| Next.js migration | `NEXTJS_MIGRATION_TRACKER.md`, `NEXTJS_DEVELOPMENT_LOG.md` |
| Stayflexi XML integration | `docs/integration/STAYFLEXI_XML_INTEGRATION_PLAN.md` |
| Pilot deployment | `docs/deployment/PILOT_DEPLOYMENT_CHECKLIST.md` |
| DB migrations | `docs/deployment/DB_MIGRATION_ROLLBACK.md` |

## Local development

```bash
cd backend && npm start      # port 5000
cd frontend && npm run dev   # port 3000
cd nextjs && npm run dev     # port 8000
```

## Definition of done

1. Existing platform flows remain intact.
2. Changes match the active phase or task scope.
3. Required env placeholders are documented when added.
4. Validation is described (manual steps or scripts run).

## Agent routing (which agent for which task)

Custom subagents live in `.cursor/agents/`. Cursor can delegate automatically based on the task, or you can invoke one explicitly with `/agent-name` in chat.

| Task | Agent | Model | Mode |
| --- | --- | --- | --- |
| Channel Manager XML, webhooks, sync, CM UI | `/channel-manager` | inherit (your chat model) | write |
| Express API, controllers, services, cron | `/backend-api` | inherit | write |
| Next.js public pages, booking flow | `/nextjs-public` | inherit | write |
| React admin/vendor dashboard | `/react-dashboard` | inherit | write |
| Schema changes, migrations, SQL review | `/db-migration` | inherit | readonly until you confirm backup + DB |
| Errors, test failures, broken flows | `/debugger` | inherit | write |
| Post-implementation review before merge | `/code-reviewer` | fast | readonly |
| Confirm work is actually complete | `/verifier` | fast | readonly |
| Pilot deploy, nginx, rollback checklists | `/deployment-ops` | inherit | write (ops steps only) |

### Model notes

- **inherit** — uses whatever model you selected in the main Agent chat (best for implementation and debugging).
- **fast** — cheaper/faster model for read-only review and verification.
- On some plans, subagent `model` may fall back to Composer; pick your main chat model for heavy work if needed.

### Built-in subagents (automatic)

Cursor also uses built-in subagents without configuration:

| Built-in | When used |
| --- | --- |
| **explore** | Broad codebase search (parallel, fast model) |
| **bash** | Long shell command output isolated from main chat |
| **browser** | Browser/MCP automation |

### Example prompts

```text
/channel-manager implement Update Rates handler for Phase 2
/nextjs-public add property filters to the listings page
/db-migration review backend/migrations/0054_add_cm_tables.sql before I run it
/code-reviewer review my last changes
/verifier confirm Phase 2 inbound ops are actually working
```

### Typical workflow

1. **Implement** — `/channel-manager`, `/backend-api`, `/nextjs-public`, or `/react-dashboard`
2. **Review** — `/code-reviewer` (readonly)
3. **Verify** — `/verifier` runs tests/checks and reports gaps
4. **Deploy** — `/deployment-ops` when ready for pilot/production
