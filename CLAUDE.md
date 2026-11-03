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

- Next.js 16 App Router with Cache Components + Partial Prefetching. Pages live in the `(app)` route group (shell layout).
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
- Entries and routines have a nullable `studyType` (`theory` | `practice`). Forms ask for it when a study topic is set or
  the category belongs to a topic; the API defaults it to `theory` when `studyTopicId` is set and it is missing.
- Study progress math is pure in `src/lib/progress.ts` (pace window: last 28 days, min 7).
- Routines are never materialized as entries: `listRoutineEntries` (`src/lib/services/routines.ts`) expands them on read
  between `startDate` and `endDate ?? today` (capped at today) and `listEntries`/topics merge them in. Virtual rows have
  `routineId` set and an id `rotina:<routineId>:<date>`; they are read-only in the UI.
- `/analises` math is pure in `src/lib/insights.ts` (window vs previous window, 14-day focus, weekly trend, heatmap).
- No authentication: no password, PIN or proxy by design (single-user app); don't reintroduce unless asked.
- Theme: school green palette (`brand-*`, `board`, `chalk`, `pencil` tokens in `src/app/globals.css`), fonts Nunito + Caveat.
- Mobile first-class (below `lg` the sidebar becomes `MobileNav`: Painel, Registros, Registrar, Estudos, "Mais" sheet). Layout rules:
  - Always give grids explicit columns (`grid-cols-1 md:grid-cols-2`, `minmax(0,…)`): an implicit `auto` column grows with its
    content and pushes the whole page wider than the screen. Chart columns in `flex` need `min-w-0`.
  - `Modal` is a bottom sheet below `sm`; form buttons go in `FormActions` (sticky there). Use `hasFinePointer()` for `autoFocus`
    so the keyboard doesn't open by itself on touch screens.
  - `inputClass` is 16px on phones (smaller makes iOS zoom in); touch targets are at least 40px (`iconButtonClass`, `min-h-*` + `sm:min-h-0`).
  - Hover-only UI uses `pointer-fine:` rather than `sm:`, since tablets have no hover.
  - Horizontally scrolling charts use `[direction:rtl]` on the scroller and `[direction:ltr]` inside, so they open on the latest data.

## Commands

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm typecheck`
- `pnpm db:generate` (after schema changes) / `pnpm db:migrate` / `pnpm db:studio`
- `pnpm db:import <file.xlsx> [--include-future]` imports the spreadsheet idempotently
