@AGENTS.md

# CLAUDE.md

## Rules for the AI

- Keep this file accurate: update it in the same change that alters structure, stack, commands or conventions.
- Code, identifiers and docs for developers are in English. User-facing copy is in Brazilian Portuguese (pt-BR).
- No comments in code unless the reason is not obvious from the code itself.
- Every new environment variable goes into `.env.example`.
- pnpm is the package manager.

## Project

Personal time tracker (free time + study topics with hour targets), ported from the "Horas Investidas na Vida" spreadsheet.

- Next.js 16 App Router with Cache Components + Partial Prefetching. Pages live in the `(app)` route group (shell layout);
  `/entrar` is the optional password screen outside it.
- Anything that reads the DB, `searchParams`/`params` or "today" must be inside `<Suspense>` and call `await connection()`
  first (otherwise prerendering fails on `new Date()`). `usePathname`/`useSearchParams` also need a `<Suspense>` boundary.
- Data: Drizzle ORM (`src/db/schema.ts`, migrations in `drizzle/`). `src/db/index.ts` uses Neon HTTP for `*.neon.tech`
  and node-postgres otherwise (local docker compose on port 5433). No interactive transactions (Neon HTTP).
- Business logic lives in `src/lib/services/*` (server-only). Route handlers in `src/app/api/*` are thin wrappers using
  `handle()` from `src/lib/api-errors.ts` (Zod → 422 with `fieldErrors`, `ApiError` → its status).
- Server pages read services directly; client components mutate through `/api/*` with `apiRequest` and then `router.refresh()`.
- Dates are `YYYY-MM-DD` strings; "today" is `todayISO()` in `NEXT_PUBLIC_TIME_ZONE` (default America/Sao_Paulo).
  Weekdays use JS numbering (0 = Sunday).
- Categories marked `isFixed` (e.g. Trabalho CLT) are excluded from "free time" on the dashboard unless toggled.
- Study progress math is pure in `src/lib/progress.ts` (pace window: last 28 days, min 7).
- Optional auth: if `APP_PASSWORD` is set, `src/proxy.ts` requires the `hours_session` cookie (SHA-256 of password + `AUTH_SECRET`).
- Theme: school green palette (`brand-*`, `board`, `chalk`, `pencil` tokens in `src/app/globals.css`), fonts Nunito + Caveat.

## Commands

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm typecheck`
- `pnpm db:generate` (after schema changes) / `pnpm db:migrate` / `pnpm db:studio`
- `pnpm db:import <file.xlsx> [--include-future]` imports the spreadsheet idempotently
