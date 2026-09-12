# AGENTS.md

Balangay — a 100% offline-first React PWA personal finance tracker (PHP ₱, `en-PH`). Vite + React 18 + strict TypeScript + Tailwind; all data lives in the browser via Dexie (IndexedDB). No backend, no network calls.

## Commands

- `npm run dev` — Vite dev server
- `npm test` — full Vitest suite (jsdom, fake-indexeddb; ~330 tests, ~60s)
- `npx vitest run src/domain/money.test.ts` — single file; tests are colocated as `*.test.ts|tsx` next to their source
- `npm run test:watch`
- `npm run build` — runs `tsc && vite build`; **this is the only typecheck step**. There is no separate lint, format, or CI pipeline — run the build before claiming a change is clean.

## Architecture

- Layer purity: `src/domain/` (pure types + money math, must not import storage) → `src/storage/` (Dexie `db` singleton, repositories, seed data) → `src/services/` (backup/CSV/PIN) and the React layer (`src/context/`, `src/components/<feature>/`).
- Components read data with `useLiveQuery` (dexie-react-hooks); writes go through repositories/services. Don't poke `db.*` directly from a component.
- `src/components/ui/` is the shared design primitives kit; feature folders own their views, modals, and colocated tests.
- Money is plain JS numbers (PHP). Always round with `roundMoney()` and format with `formatPHP()` / `<AmountDisplay>` from `src/domain/money.ts` — never raw float math or `toFixed` for money.

### Transaction invariants (`src/domain/types.ts`)

- `amount` is always a positive number; sign lives in `type`.
- `accountId` = source account for expense/transfer, destination for income.
- Transfers require a distinct `toAccountId`.
- Dates are `YYYY-MM-DD`-style strings; grouping/formatting is `en-PH`.

## Testing quirks

- DB-backed tests share the singleton `db`, so call `await resetDatabase()` (from `src/storage/db.ts`) in `beforeEach`. App/context tests also clear `sessionStorage`/`localStorage` — see `src/App.test.tsx`.
- `src/test/setup.ts` auto-installs `fake-indexeddb` + jest-dom; no per-file boilerplate needed.
- Flaky-by-design pair: "Today"/"Yesterday" assertions in `RecentActivityBento.test.tsx` and `TransactionsView.test.tsx` build dates from `toISOString()` (UTC) but the components compare against local time, so they fail for several late-night hours. Not a regression — don't chase it.
- TDD (Red-Green-Refactor) is mandatory for financial logic and state mutations.

## Governance

- `PROJECT_RULES.md` is authoritative: skill-driven workflow (TDD, `brainstorming` before features, `verification-before-completion`), 64 skills under `.agents/skills/`. Read it before non-trivial work; don't start code without tests.
- Design language "Soft Neo-Brutalism / Playful Pastel Bento" is locked: oat canvas `#F7F2E8`, pastel accents (butter `#FFED9E`, blossom `#F2C0CA`, pistachio `#DAE097`, sky `#A6CFF2`), dark anchors `#111111`/`#124224`. Tokens live in `tailwind.config.js`; use them instead of inventing colors. No gradients, no heavy shadows.
- Full, unabridged output is required — placeholders or truncated code is prohibited.
- Commits go to `master` with conventional prefixes (`feat:`, `fix:`, `chore:`).

## Mandatory skills (read before the relevant task)
- Slop filter + Delivery Gate: `.agents/skills/antislop/SKILL.md` — run the
  PASS/FAIL Delivery Gate before marking ANY task complete.
- UI/styling changes: also read `.agents/skills/antislop-ui/SKILL.md`
- Code changes: also read `.agents/skills/antislop-code/SKILL.md`
- Copy/text changes: also read `.agents/skills/antislop-copywriting/SKILL.md`
- Focus/a11y work: also read `.agents/skills/antislop-human/SKILL.md`
- Responsive work: also read `.agents/skills/antislop-layoutmobile/SKILL.md`
- Design critique/polish: `.agents/skills/critique/SKILL.md`
Design system law remains in PROJECT_RULES.md — hex codes, radii, and bans
are non-negotiable.