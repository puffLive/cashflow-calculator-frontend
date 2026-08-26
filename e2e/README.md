# E2E Test Suite

True full-stack Playwright tests: a real backend (Express + Socket.IO) runs
against an **in-memory MongoDB** (`mongodb-memory-server`), so no Docker,
local mongod, or Atlas connection is needed — and tests can never touch the
production database (the `VITE_*` values in `.env` point at Railway; the
Playwright config overrides them with `http://localhost:3100`).

## Running

```bash
npm run test:e2e            # everything (boots backend :3100 + frontend :5173)
npx playwright test --project=chromium          # desktop only
npx playwright test buy-audit-flow --headed     # one spec, visible browser
npx playwright show-report                      # open the HTML report
```

The first run may take a minute while `mongodb-memory-server` downloads its
MongoDB binary. Servers already running on :3100/:5173 are reused locally.

## Architecture

- `helpers/api.ts` — `GameApi`, a thin REST client used to arrange state
  fast (create/join/setup/start) and to assert **backend truth** after UI
  actions.
- `helpers/ui.ts` — user-level flows (create game, join, setup wizard, buy
  stock) plus locator utilities (`readMetric`, `fieldByLabel`).
- `helpers/fixtures.ts` — the `game` fixture: a started 2-player game
  (host = Secretary, p2 = Teacher, each the other's auditor) with both
  dashboards open in separate browser contexts. Sessions are adopted by
  seeding `sessionStorage` before navigation.

Every test creates its own game room, so the suite runs fully parallel
against the single shared backend.

## Projects

- `chromium` — all tests.
- `Mobile Chrome` (Pixel 5) — only tests tagged `@mobile` (entry flows and
  the dashboard, i.e. the mobile-first happy path).

## Known-bug conventions

- `test.fail(true, reason)` — the test asserts the **correct** behavior for
  a confirmed bug. It "passes" today by failing. When the bug is fixed,
  Playwright reports *"expected to fail but passed"*: delete the
  `test.fail(...)` line and keep the test as a regression guard.
- `test.fixme(...)` — the flow is too broken to execute meaningfully.
  The body documents what to assert once the fix lands.

As of the 2026-08-26 remediation pass, every `test.fail` lock has been
converted to an always-green regression guard (`known-bugs.spec.ts` holds
the API-level ones). The only remaining fixmes are the baby-event preview
(+$0/month display bug) and audit-queue rehydration after a refresh.

## Spec map

| Spec | Covers |
|---|---|
| `entry-flows.spec.ts` | Landing, 404/guards, create game, join (invalid code, case-insensitivity, full game) |
| `player-setup.spec.ts` | Profession assignment, dream requirement, auditor persistence, preview-vs-backend consistency |
| `lobby.spec.ts` | Roster, realtime join, solo-start refusal, 2-player start → dashboard broadcast |
| `dashboard-payday.spec.ts` | Metrics vs backend truth, action buttons, fast-track bar, PAYDAY collection + cross-player sync |
| `buy-audit-flow.spec.ts` | Buy wizard math, audit approve/reject with note, queue counts |
| `take-loan.spec.ts` | Increment control, approved loan cash/liability (+ expense double-count bug lock) |
| `sell-and-market.spec.ts` | Sell wizard opens; collect-money request; fixmes for the broken sell/market endpoints |
| `detail-screens.spec.ts` | Income/expenses/assets/liabilities screens (+ history crash bug lock) |
| `multiplayer-sync.spec.ts` | Players overview sync, disconnect/reconnect lifecycle |
| `known-bugs.spec.ts` | API-level regression locks: loan double-count, orphaned no-auditor transactions, overview cashflow mislabel, stale shared-package data |
| `session-expiry.spec.ts` | 410 → SessionExpiredModal, credential wipe (mocked API, no backend needed) |
