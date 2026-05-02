# Cashflow Calculator — Frontend Development Task List
## PRD v2.2 | React + Redux + Tailwind CSS + Socket.io Client + Playwright

> **Scope:** This file covers all frontend development tasks including: project setup, Redux state management, Socket.io client integration, all UI screens and components, responsive design, accessibility, and Playwright E2E testing. The frontend consumes the shared calculation engine and type definitions published by the backend team.
>
> **Dependency:** The frontend depends on the `/shared` package (TypeScript types, interfaces, and calculation engine) produced by the backend team. Coordinate on the shared package API before starting Sprint 2.

---

## 📊 COMPLETION STATUS (last audited 2026-05-01)

- ✅ **Features 1–13**: API client, Socket.io service, Redux state, all 22 screens, all transaction wizards, audit (remote + handoff), cross-player views, disconnection/reconnection UI, session expiry UI, transaction history & undo
- ⚠️ **Feature 0.3.4**: Shared types not wired up — frontend uses hardcoded duplicates in `src/types/`
- ⚠️ **Feature 10.3.4–10.3.7**: Pending-transaction polish (re-notify, FAB lockout, finalized-value animation, rejection pre-population)
- ⚠️ **Feature 14**: Responsive audits not done; A11y partial (some aria/focus shipped, no contrast or screen-reader audits)
- ⚠️ **Feature 15**: 2 of ~27 E2E specs written (`game-flow.spec.ts`, `transaction-audit-flow.spec.ts`); only 1 vitest unit test (`transactionSlice.test.ts`)
- ⚠️ **Feature 16**: Post-Audit Follow-ups — see new section at the end

---

## FEATURE 0: Project Setup & Configuration ✅

### 0.1 React Application Setup
- [x] **0.1.1** Scaffold React app with Vite and TypeScript template
- [x] **0.1.2** Install and configure Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- [x] **0.1.3** Install and configure RTK Query for API data fetching
- [x] **0.1.4** Install and configure Tailwind CSS with PostCSS
- [x] **0.1.5** Install React Router (`react-router-dom`) for client-side routing
- [x] **0.1.6** Install Socket.io client (`socket.io-client`)
- [x] **0.1.7** Install UI utility libraries: `clsx` (conditional classes), `lucide-react` (icons)
- [x] **0.1.8** Configure path aliases in `vite.config.ts` and `tsconfig.json` (`@/components`, `@/store`, `@/services`, `@/hooks`, `@/screens`, `@/shared`)
- [x] **0.1.9** Set up ESLint + Prettier with TypeScript and React rules
- [x] **0.1.10** Create `.env` config for API base URL and Socket.io URL

### 0.2 Tailwind Configuration
- [x] **0.2.1** Configure custom color palette in `tailwind.config.js`:
  - Income green: `#2E7D32` (and lighter/darker variants)
  - Expense red: `#C62828` (and variants)
  - Neutral blue: `#2D6A9F` (and variants)
  - Pending amber: `#F9A825`
  - Background grays: `#F5F5F5`, `#E0E0E0`, `#333333`
- [x] **0.2.2** Configure responsive breakpoints: `sm` (640px), `md` (768px tablet), `lg` (1024px desktop)
- [x] **0.2.3** Set base font family and size scale
- [x] **0.2.4** Create Tailwind component classes for repeated patterns: `.card`, `.btn-primary`, `.btn-danger`, `.metric-card`, `.badge`

### 0.3 Project Structure
- [x] **0.3.1** Create directory structure:
  ```
  src/
  ├── components/    # Reusable UI components
  ├── screens/       # Full-page screen components
  ├── store/         # Redux slices and store config
  ├── services/      # API client (RTK Query) + Socket.io service
  ├── hooks/         # Custom React hooks
  ├── utils/         # Frontend utility functions
  ├── types/         # Local type extensions (if needed beyond shared)
  └── constants/     # UI constants (colors, routes, etc.)
  ```
- [x] **0.3.2** Configure Redux store with middleware (RTK Query middleware, logger in dev)
- [x] **0.3.3** Set up React Router with route definitions (see 0.4)
- [ ] **0.3.4** Import and configure the shared types/interfaces from the backend's `/shared` package

### 0.4 Route Definitions
- [x] **0.4.1** Define application routes:
  - `/` — Landing page (Create/Join)
  - `/game/:roomCode/lobby` — Game lobby
  - `/game/:roomCode/setup` — Player setup wizard
  - `/game/:roomCode/dashboard` — Main dashboard
  - `/game/:roomCode/players` — All players overview
  - `/game/:roomCode/income` — Income detail
  - `/game/:roomCode/expenses` — Expense detail
  - `/game/:roomCode/assets` — Assets detail
  - `/game/:roomCode/liabilities` — Liabilities detail
  - `/game/:roomCode/history` — Transaction history
  - `/game/:roomCode/transaction/:type` — Transaction wizard (buy/sell/loan/event)
- [x] **0.4.2** Route guards expanded in `src/components/ProtectedRoute.tsx`. Two new boolean props: `redirectIfStarted` (sends user from lobby → dashboard once `session.status === 'active'`) and `redirectIfSetupComplete` (sends user from setup → dashboard if game active, or → lobby if waiting, when `playerSetupComplete` flag is set). Both wired up in `App.tsx`: the lobby route now uses `<ProtectedRoute redirectIfStarted>` and the setup route uses `<ProtectedRoute redirectIfSetupComplete>`. Existing `requireSetup` behavior preserved for gameplay routes.
- [x] **0.4.3** Invalid / expired room codes handled at the `ProtectedRoute` layer: (a) malformed room codes (not 6 alphanumeric chars) bounce to landing **without an API round-trip** — the query is now `skip`'d when the URL param fails the `^[A-Z0-9]{6}$` test; (b) 404 from `getGameSession` shows a "Room code not found" inline error UI; (c) 410 shows a distinct "Game session has expired" error. Backed by 11 unit tests in `src/test/components/ProtectedRoute.test.tsx` covering: malformed-too-short / malformed-non-alphanumeric (both verify the API was NOT called); 404 / 410 error-UI rendering; both inverse-redirect props in their fire / no-fire paths; the existing `requireSetup` happy + expired paths. Frontend test count: 115 → **126 across 12 files**.

### 0.5 Testing Setup
- [x] **0.5.1** Install and configure Playwright with Chromium, WebKit (Safari), and Firefox
- [x] **0.5.2** Create Playwright config file with base URL pointing to dev server (`playwright.config.ts`)
- [x] **0.5.3** Create E2E test directory structure: `e2e/`
- [ ] **0.5.4** Create Playwright test helpers/fixtures: `createTestGame()`, `joinTestGame(roomCode)`, `completeSetup()`, `getApiClient()` — partial; flesh out the full helper library
- [x] **0.5.5** Install and configure Vitest for component/hook unit tests (`vitest.config.ts`)
- [x] **0.5.6** Add test scripts: `test`, `test:ui`, `test:coverage`, `test:e2e`, `test:e2e:headed`, `test:e2e:ui`

---

## FEATURE 1: API Client & Socket.io Service ✅

### 1.1 RTK Query API Client
- [x] **1.1.1** Create RTK Query API slice (`apiSlice`) with base URL from env config
- [x] **1.1.2** Define API endpoints — Game Sessions:
  - `createGame(gameVersion)` → POST `/api/games`
  - `getGameSession(roomCode)` → GET `/api/games/:roomCode`
  - `joinGame({ roomCode, playerName })` → POST `/api/games/:roomCode/join`
  - `startGame(roomCode)` → PATCH `/api/games/:roomCode/start`
- [x] **1.1.3** Define API endpoints — Player:
  - `setupPlayer({ roomCode, playerId, profession, dream, auditorPlayerId })` → POST `/api/games/:roomCode/players/:id/setup`
  - `getPlayer({ roomCode, playerId })` → GET `/api/games/:roomCode/players/:id`
  - `getAllPlayers(roomCode)` → GET `/api/games/:roomCode/players`
  - `collectPayday({ roomCode, playerId })` → POST `/api/games/:roomCode/players/:id/payday`
  - `reconnectPlayer({ roomCode, playerId })` → POST `/api/games/:roomCode/players/:id/reconnect`
  - `reassignAuditor({ roomCode, playerId, newAuditorPlayerId })` → PATCH `/api/games/:roomCode/players/:id/auditor`
- [x] **1.1.4** Define API endpoints — Transactions:
  - `submitTransaction({ roomCode, playerId, type, subType, details })` → POST `/api/games/:roomCode/players/:id/transactions`
  - `getTransactions({ roomCode, playerId?, type?, limit?, offset? })` → GET `/api/games/:roomCode/transactions`
  - `auditTransaction({ roomCode, txId, action, note? })` → PATCH `/api/games/:roomCode/transactions/:txId/audit`
  - `undoTransaction({ roomCode, playerId })` → POST `/api/games/:roomCode/players/:id/undo`
- [x] **1.1.5** Configure cache invalidation tags: `['GameSession', 'Player', 'AllPlayers', 'Transactions']`
- [x] **1.1.6** Add error handling and typed error responses

### 1.2 Socket.io Client Service
- [x] **1.2.1** Create `SocketService` singleton class that manages the Socket.io connection
- [x] **1.2.2** `connect(serverUrl)` — establish connection
- [x] **1.2.3** `joinRoom(roomCode)` — join the game session's Socket.io room
- [x] **1.2.4** `disconnect()` — clean up connection
- [x] **1.2.5** `onEvent(eventName, callback)` — register event listeners with type safety using shared event types
- [x] **1.2.6** `offEvent(eventName)` — unregister event listeners
- [x] **1.2.7** Handle automatic reconnection: on reconnect, re-join room and fetch latest state from API

### 1.3 Socket.io ↔ Redux Integration
- [x] **1.3.1** Create `useSocketEvents` custom hook that connects Socket.io events to Redux dispatches
- [x] **1.3.2** Map Socket.io events to Redux actions:
  - `player:joined` → dispatch to gameSession slice (add player to list)
  - `game:started` → dispatch to gameSession slice (set status to active, navigate to dashboard)
  - `transaction:pending` → dispatch to audit slice (add to pending reviews, if current user is auditor)
  - `transaction:finalized` → dispatch to player slice (update financial data), invalidate RTK Query cache
  - `transaction:rejected` → dispatch to transaction slice (mark as rejected, show rejection note)
  - `payday:collected` → dispatch to allPlayers slice (update the collecting player's data)
  - `player:updated` → dispatch to allPlayers slice (refresh player summary)
  - `player:disconnected` → dispatch to allPlayers slice (set connectionStatus)
  - `player:reconnected` → dispatch to allPlayers slice (set connectionStatus)
  - `player:removed` → dispatch to allPlayers slice (mark as removed), show notification
  - `fasttrack:achieved` → dispatch notification (celebratory toast/modal)
  - `session:expiry_warning` → dispatch to ui slice (show warning banner)
  - `session:expired` → dispatch to ui slice (show expired modal, navigate to landing)
- [x] **1.3.3** Initialize the hook at the app level (inside the game route layout)

---

## FEATURE 2: Redux State Management ✅

### 2.1 Store Configuration
- [x] **2.1.1** Configure Redux store with slices + RTK Query middleware
- [x] **2.1.2** Set up Redux DevTools for development

### 2.2 Redux Slices
- [x] **2.2.1** `gameSessionSlice` — state: `roomCode`, `status`, `hostPlayerId`, `playerCount`, `maxPlayers`, `currentPlayerId` (self)
- [x] **2.2.2** `playerSlice` — state: full financial data for the current player: `cashOnHand`, `salary`, `income`, `expenses`, `assets`, `liabilities`, `numberOfChildren`, `isOnFastTrack`, computed values (`totalIncome`, `totalExpenses`, `paydayAmount`, `cashflow`, `passiveIncome`)
- [x] **2.2.3** `allPlayersSlice` — state: array of player summaries for all players in the session (name, profession, key metrics, connectionStatus)
- [x] **2.2.4** `auditSlice` — state: `pendingReviews` (array of transactions awaiting current user's audit action), `pendingCount`
- [x] **2.2.5** `transactionSlice` — state: `pendingTransaction` (the current user's in-flight transaction awaiting audit), `transactionHistory` (recent entries)
- [x] **2.2.6** `uiSlice` — state: `activeTab`, `expiryWarningVisible`, `notifications` (toast queue), `isReconnecting`
- [x] **2.2.7** Create typed hooks: `useAppDispatch`, `useAppSelector`

### 2.3 Selectors
- [x] **2.3.1** `selectCurrentPlayer` — returns full player financial data
- [x] **2.3.2** `selectPaydayAmount` — returns computed PAYDAY amount
- [x] **2.3.3** `selectCashflow` — returns passive income minus expenses
- [x] **2.3.4** `selectIsOnFastTrack` — returns boolean
- [x] **2.3.5** `selectAllPlayers` — returns all player summaries
- [x] **2.3.6** `selectPendingAuditCount` — returns number of pending audits for current user
- [x] **2.3.7** `selectHasPendingTransaction` — returns boolean (is current user waiting on auditor)
- [x] **2.3.8** `selectIsHost` — returns boolean

---

## FEATURE 3:  Game Creation & Joining — UI ✅

### 3.1 Landing Page
- [x] **3.1.1** Create `LandingScreen` component with app branding/title
- [x] **3.1.2** Two primary action buttons: "Create New Game" and "Join Existing Game"
- [x] **3.1.3** Style mobile-first: centered layout, large touch-friendly buttons (≥44px height)
- [x] **3.1.4** Add subtle background or illustration reflecting the Cashflow game theme

### 3.2 Create Game Flow
- [x] **3.2.1** Create `CreateGameScreen` component
- [x] **3.2.2** Input: player name (required, text field)
- [x] **3.2.3** Game version display: "Cashflow 101" (read-only for MVP — only one option)
- [x] **3.2.4** "Create Game" button calls `createGame` API + `joinGame` API (host auto-joins)
- [x] **3.2.5** On success: display room code prominently in large font with a "Copy Code" button and "Share" button (Web Share API on mobile)
- [x] **3.2.6** "Continue to Lobby" button navigates to the lobby screen
- [x] **3.2.7** Handle loading state (spinner) and error state (API failure message)

### 3.3 Join Game Flow
- [x] **3.3.1** Create `JoinGameScreen` component
- [x] **3.3.2** Input: room code (6-character field, auto-uppercase, monospace font for readability)
- [x] **3.3.3** Input: player name (required)
- [x] **3.3.4** "Join Game" button calls `joinGame` API
- [x] **3.3.5** Display contextual error messages: "Room not found", "Game already started", "Session full (6/6 players)", "Room code expired"
- [x] **3.3.6** On success: navigate to the lobby screen
- [x] **3.3.7** Handle loading and error states

### 3.4 Game Lobby Screen
- [x] **3.4.1** Create `GameLobbyScreen` component
- [x] **3.4.2** Display room code prominently at the top with copy/share buttons
- [x] **3.4.3** Player count indicator: "3/6 Players"
- [x] **3.4.4** Player list: each row shows name, profession (or "Setting up..."), status badge (Configuring / Ready)
- [x] **3.4.5** If current user has NOT completed setup → show "Set Up Your Player" button
- [x] **3.4.6** If current user HAS completed setup → show "Ready" badge, wait for others
- [x] **3.4.7** "Start Game" button: visible only to host, enabled only when ALL players are ready, calls `startGame` API
- [x] **3.4.8** Subscribe to `player:joined` Socket.io event to add new players to the list in real time
- [x] **3.4.9** Subscribe to `player:updated` event to update setup status in real time
- [x] **3.4.10** Subscribe to `game:started` event to navigate all players to the dashboard
- [x] **3.4.11** Fetch session data on mount via RTK Query (`getGameSession`)

---

## FEATURE 4: Player Setup Wizard — UI ✅

### 4.1 Setup Wizard Container
- [x] **4.1.1** Create `PlayerSetupScreen` as a multi-step wizard with progress indicator (Step 1 of 4, Step 2 of 4, etc.)
- [x] **4.1.2** Manage local wizard state (selected profession, dream, auditor) before final submission
- [x] **4.1.3** "Back" button on each step to return to previous step
- [x] **4.1.4** Persist wizard state locally so it survives accidental back-navigation

### 4.2 Step 1: Profession Selection
- [x] **4.2.1** Create `ProfessionPicker` component
- [x] **4.2.2** Display all 12 professions as selectable cards in a scrollable grid (2 columns on mobile)
- [x] **4.2.3** Each card shows: profession name, salary, starting savings, total monthly expenses
- [x] **4.2.4** On tap, card becomes selected (highlighted border/background)
- [x] **4.2.5** Expandable detail: tapping "View Details" on a selected card shows full financial breakdown — all income, expense line items, starting liabilities with balances
- [x] **4.2.6** "Next" button enabled only when a profession is selected

### 4.3 Step 2: Dream Selection
- [x] **4.3.1** Create `DreamPicker` component
- [x] **4.3.2** Display all dream options as selectable cards
- [x] **4.3.3** Each card shows: dream name and associated cost
- [x] **4.3.4** Single-select with visual highlight
- [x] **4.3.5** "Next" button enabled only when a dream is selected

### 4.4 Step 3: Auditor Assignment
- [x] **4.4.1** Create `AuditorPicker` component
- [x] **4.4.2** Display a list or dropdown of other players in the session (fetched from `getGameSession` or allPlayers Redux state)
- [x] **4.4.3** Disable selection of self
- [x] **4.4.4** If only one other player → auto-select them
- [x] **4.4.5** Show "Waiting for other players to join..." if no other players yet
- [x] **4.4.6** Update list in real time as new players join (via Socket.io `player:joined`)
- [x] **4.4.7** "Next" button enabled only when an auditor is selected

### 4.5 Step 4: Review & Confirm
- [x] **4.5.1** Create `SetupReviewScreen` showing summary: selected profession (with salary and expenses), selected dream (with cost), selected auditor
- [x] **4.5.2** Full starting financial snapshot: Cash on Hand, Total Income, Total Expenses, PAYDAY Amount, starting liabilities list
- [x] **4.5.3** "Confirm" button calls the `setupPlayer` API
- [x] **4.5.4** On success: update Redux state, navigate back to lobby in "Ready" status
- [x] **4.5.5** Handle loading and error states
- [x] **4.5.6** "Edit" links on each section to jump back to the corresponding step

---

## FEATURE 5: Main Dashboard — UI ✅

### 5.1 Dashboard Screen
- [x] **5.1.1** Create `DashboardScreen` as the primary game view
- [x] **5.1.2** Fetch player data on mount via `getPlayer` RTK Query endpoint
- [x] **5.1.3** Layout: metric cards grid at the top, Collect PAYDAY button below, quick-action FAB

### 5.2 Financial Metric Cards
- [x] **5.2.1** Create `MetricCard` reusable component: label, value (large font), optional subtitle
- [x] **5.2.2** Display 6 metric cards:
  - Cash on Hand (blue, largest prominence)
  - Cashflow (green if positive, red if negative)
  - Total Income (green)
  - Total Expenses (red)
  - PAYDAY Amount (green, high prominence)
  - Passive Income (green)
- [x] **5.2.3** Apply color coding: green (#2E7D32) for income/positive, red (#C62828) for expenses/negative, blue (#2D6A9F) for neutral
- [x] **5.2.4** Responsive grid: 2 columns on mobile (360px), 3 columns on tablet (768px), single row on desktop
- [x] **5.2.5** Numbers formatted with dollar signs and commas (e.g., "$12,500")

### 5.3 Collect PAYDAY Button
- [x] **5.3.1** Create `CollectPaydayButton` component — large, green (#2E7D32), full-width on mobile
- [x] **5.3.2** Display PAYDAY amount on the button text: "Collect PAYDAY: $X,XXX"
- [x] **5.3.3** On tap: call `collectPayday` API, show brief loading state
- [x] **5.3.4** On success: animate the Cash on Hand metric card updating (e.g., number counting up)
- [x] **5.3.5** Show a success toast: "PAYDAY collected! +$X,XXX"
- [x] **5.3.6** Disable the button while a PAYDAY API call is in progress (prevent double-tap)

### 5.4 Fast Track Indicator
- [x] **5.4.1** Create `FastTrackProgress` component showing a visual indicator: progress bar or ratio of Passive Income vs. Total Expenses
- [x] **5.4.2** Label: "Passive Income: $X / Expenses: $Y" with a progress bar filling as passive income approaches expenses
- [x] **5.4.3** When `isOnFastTrack` is true: trigger a celebratory modal/animation ("You escaped the Rat Race!")
- [x] **5.4.4** After celebration: transition dashboard to a "Fast Track" visual mode (different header color/banner, "FAST TRACK" badge)
- [x] **5.4.5** Listen for `fasttrack:achieved` Socket.io event for OTHER players → display toast notification: "[Player Name] escaped the Rat Race!"

### 5.5 Navigation Bar
- [x] **5.5.1** Create `BottomNavBar` component (mobile) with 6 tabs: Dashboard, Players, Income, Expenses, Assets, Liabilities
- [x] **5.5.2** Each tab: icon (lucide-react) + label below
- [x] **5.5.3** Active tab highlighted with color + bold label
- [x] **5.5.4** Badge on "Players" tab showing pending audit count (from `selectPendingAuditCount`)
- [x] **5.5.5** Create `SidebarNav` component (desktop/tablet, lg breakpoint) with same tabs as vertical list
- [x] **5.5.6** Responsive: show `BottomNavBar` on mobile, `SidebarNav` on desktop
- [x] **5.5.7** All tab taps navigate to the corresponding route via React Router

### 5.6 Floating Action Button (FAB)
- [x] **5.6.1** Create `TransactionFAB` component — circular button fixed to bottom-right (above nav bar)
- [x] **5.6.2** "+" icon; on tap, expand into a quick-action menu: Buy, Sell, Loan, Market Event
- [x] **5.6.3** Each action navigates to the corresponding transaction wizard route
- [x] **5.6.4** Disable FAB if player has a pending transaction awaiting audit (show tooltip: "Waiting for auditor")
- [x] **5.6.5** Style with Tailwind: shadow, smooth expand animation

### 5.7 Detail Screens ✅
- [x] **5.7.1** Create `IncomeDetailScreen`: salary line item + list of all passive income sources (type, name, amount per month)
- [x] **5.7.2** Create `ExpenseDetailScreen`: list of all expense line items (taxes, mortgage, school loan, car loan, credit card, other expenses, child expenses, bank loan payment) with amounts; total at bottom
- [x] **5.7.3** Create `AssetDetailScreen`: card-based list of all owned assets; each card shows: type icon, name, quantity, cost basis, monthly passive income (if any); "Sell" button on each card (navigates to sell wizard pre-populated with that asset)
- [x] **5.7.4** Create `LiabilityDetailScreen`: list of all debts; each row shows: type icon, name, original amount, current balance, monthly payment; "Pay Off" button on each row (navigates to pay-off wizard pre-populated with that liability)
- [x] **5.7.5** All detail screens read from the `playerSlice` Redux state
- [x] **5.7.6** Pull-to-refresh or auto-refresh on Socket.io `player:updated` event

---

## FEATURE 6: Buy Transaction Wizard — UI ✅

### 6.1 Buy Wizard Flow
- [x] **6.1.1** Create `BuyTransactionScreen` as a step-by-step wizard

### 6.2 Step 1: Asset Type Selection
- [x] **6.2.1** Display 6 asset type cards: Stocks, Mutual Funds, CDs, Real Estate, Gold/Precious Metals, Business
- [x] **6.2.2** Each card has an icon and brief description
- [x] **6.2.3** Single-select; "Next" enabled on selection

### 6.3 Step 2: Transaction Details Input
- [x] **6.3.1** Dynamically render input form based on selected asset type:
  - **Stocks / Mutual Funds:** Stock/Fund name (text), Price per share (number), Number of shares (number), Dividend per share (number, optional)
  - **CDs:** CD value (number), Interest rate (percentage)
  - **Real Estate:** Property name (text), Total cost (number), Down payment (number), Mortgage amount (number), Monthly cashflow (number)
  - **Gold:** Type/description (text), Cost per unit (number), Quantity (number)
  - **Business:** Name (text), Total cost (number), Down payment (number), Monthly cashflow (number)
- [x] **6.3.2** Show real-time cost calculation: "Total Cost: $X,XXX"
- [x] **6.3.3** Show real-time validation bar: "Cash on Hand: $X,XXX | Cost: $Y,YYY | Remaining: $Z,ZZZ" — turn red with warning if insufficient cash
- [x] **6.3.4** All number inputs use `inputMode="numeric"` for mobile keyboards
- [x] **6.3.5** All touch targets ≥ 44px

### 6.4 Step 3: Review Impact
- [x] **6.4.1** Display full financial impact summary using the shared calculation engine (run client-side for preview):
  - Before → After for: Cash on Hand, Total Income, Total Expenses, PAYDAY Amount, Cashflow
  - New asset details
  - New liability details (if real estate/business)
- [x] **6.4.2** Color-code changes: green for improvements, red for costs
- [x] **6.4.3** "Edit" link to go back to Step 2

### 6.5 Step 4: Confirm & Submit
- [x] **6.5.1** "Are you sure this is correct?" confirmation prompt
- [x] **6.5.2** Two buttons: "Submit for Audit" (primary) and "Handoff to Auditor" (secondary)
- [x] **6.5.3** On "Submit for Audit": call `submitTransaction` API, navigate to dashboard with pending transaction state
- [x] **6.5.4** On "Handoff to Auditor": call `submitTransaction` API, then navigate to the `HandoffAuditScreen`
- [x] **6.5.5** Handle loading state and API errors

---

## FEATURE 7: Sell Transaction Wizard — UI ✅

### 7.1 Sell Wizard Flow
- [x] **7.1.1** Create `SellTransactionScreen` as a step-by-step wizard

### 7.2 Step 1: Asset Selection
- [x] **7.2.1** Display list of currently owned assets (from `playerSlice`) as selectable cards
- [x] **7.2.2** Each card shows: asset type icon, name, quantity owned, cost basis, current passive income
- [x] **7.2.3** If no assets owned, show empty state: "You don't have any assets to sell"
- [x] **7.2.4** Single-select; "Next" enabled on selection

### 7.3 Step 2: Sale Details
- [x] **7.3.1** Input: sale/offer price per unit (number)
- [x] **7.3.2** Input: quantity to sell (number, max = owned quantity; pre-fill with full quantity for non-divisible assets like real estate)
- [x] **7.3.3** Show real-time capital gain/loss: "(Sale Price − Cost Basis) × Quantity = $X,XXX gain/loss"
- [x] **7.3.4** Show total sale proceeds

### 7.4 Step 3: Review Impact
- [x] **7.4.1** Full financial impact summary: Cash on Hand increase, asset removal/reduction, passive income removal, liability removal (if applicable), expense reduction (if applicable)
- [x] **7.4.2** Capital gain/loss prominently displayed

### 7.5 Step 4: Confirm & Submit
- [x] **7.5.1** Confirmation prompt + Submit for Audit / Handoff to Auditor buttons
- [x] **7.5.2** Handle submission and pending state

---

## FEATURE 8: Loan Module — UI ✅

### 8.1 Take Loan Wizard
- [x] **8.1.1** Create `TakeLoanScreen` component
- [x] **8.1.2** Input: stepper or slider for number of $1,000 increments (1, 2, 3... up to configurable max)
- [x] **8.1.3** Real-time display: "Loan Amount: $X,000 | Monthly Payment: $X00 | New PAYDAY: $X,XXX"
- [x] **8.1.4** Show impact preview card: Cash on Hand (before → after), Expenses (before → after), PAYDAY Amount (before → after), new Liability entry
- [x] **8.1.5** Confirm & submit for audit

### 8.2 Pay Off Loan Wizard
- [x] **8.2.1** Create `PayOffLoanScreen` component
- [x] **8.2.2** Step 1: Display all current liabilities as selectable cards (name, type, current balance, monthly payment)
- [x] **8.2.3** If no liabilities, show empty state
- [x] **8.2.4** Step 2: Input payoff amount
  - For bank loans: stepper in $1,000 increments (max = current balance)
  - For other loans: free-form amount input (max = current balance, max = Cash on Hand)
- [x] **8.2.5** Real-time validation: "Cash on Hand: $X | Payoff: $Y | Remaining Cash: $Z"
- [x] **8.2.6** Show impact preview: Cash (before → after), Expense reduction, Liability reduction, new PAYDAY Amount
- [x] **8.2.7** Confirm & submit for audit

---

## FEATURE 9: Market Events — UI ✅

### 9.1 Market Event Selection Screen
- [x] **9.1.1** Create `MarketEventScreen` with event type cards: Downsized, Charity, Doodad, Baby, Stock Split, Reverse Stock Split, Lend/Collect Money

### 9.2 Event-Specific Flows
- [x] **9.2.1** **Downsized:** Confirmation screen showing Total Expenses amount to be deducted. If Cash on Hand < Total Expenses, show warning: "You don't have enough cash. You'll need to take a loan." Include link to loan wizard.
- [x] **9.2.2** **Charity:** Auto-calculate 10% of Total Income. Display: "Donate $X,XXX (10% of $XX,XXX income)." Confirm button.
- [x] **9.2.3** **Doodad:** Amount input field. Show remaining Cash on Hand after deduction. Confirm button.
- [x] **9.2.4** **Baby:** Confirmation showing: "Congratulations! New child expense: +$XXX/month. New Total Expenses: $X,XXX. New PAYDAY: $X,XXX." Confirm button.
- [x] **9.2.5** **Stock Split:** Display list of owned stocks as selectable cards. Select one → show before/after: "Shares: X → X×2 | Cost/Share: $Y → $Y/2." Confirm button.
- [x] **9.2.6** **Reverse Stock Split:** Same as stock split but inverse: "Shares: X → X/2 (rounded down) | Cost/Share: $Y → $Y×2." Confirm button.
- [x] **9.2.7** **Lend / Collect Money:** Amount input. Toggle or sign selector for lend (negative) vs. collect (positive). Show Cash on Hand impact. Confirm button.

### 9.3 Submission
- [x] **9.3.1** All events follow the review → confirm → audit submission pattern
- [x] **9.3.2** Multi-category events trigger audit; simple cash adjustments may be auto-approved (based on backend logic)

---

## FEATURE 10: Auditor Review — UI ✅

### 10.1 Remote Audit Mode (Auditor's Own Device)
- [x] **10.1.1** Create `AuditNotificationBadge` component — shows count on the Players nav tab and as a floating indicator
- [x] **10.1.2** Listen for `transaction:pending` Socket.io events where the current user is the auditor
- [x] **10.1.3** On event: add to `auditSlice.pendingReviews`, increment badge count, show push-style toast: "[Player] submitted a [type] transaction for review"
- [x] **10.1.4** Create `PendingAuditsScreen` accessible from the Players tab or the notification badge
- [x] **10.1.5** List of pending reviews: player name, transaction type, timestamp, "Review" button
- [x] **10.1.6** Create `AuditReviewScreen` showing full transaction detail:
  - Player name and profession
  - Transaction type and description
  - Before → After table for ALL affected financial categories
  - Asset/liability details
- [x] **10.1.7** "Approve" button (green, large) and "Reject" button (red, large)
- [x] **10.1.8** On "Reject": expand a text input for rejection note (required)
- [x] **10.1.9** On Approve/Reject: call `auditTransaction` API, show confirmation, remove from pending list
- [x] **10.1.10** Handle loading states during API call

### 10.2 Handoff Audit Mode (Same Device)
- [x] **10.2.1** After a player submits a transaction and taps "Handoff to Auditor":
- [x] **10.2.2** Navigate to `HandoffAuditScreen` — clearly labeled "AUDITOR REVIEW" with distinct visual treatment (different background color/header)
- [x] **10.2.3** Same transaction detail layout as remote mode (before/after table, full impact summary)
- [x] **10.2.4** "Approve" and "Reject" buttons
- [x] **10.2.5** "Return to Player" button that navigates back to the player's dashboard
- [x] **10.2.6** No authentication required — trust-based UX

### 10.3 Pending Transaction State (Player Side)
- [x] **10.3.1** When a transaction is submitted and awaiting audit, update the dashboard to show pending state
- [x] **10.3.2** Pending metric values shown with amber (#F9A825) color and a "Pending" badge
- [x] **10.3.3** "Waiting for Auditor" indicator with elapsed time counter
- [x] **10.3.4** Re-notify Auditor — full backend + frontend round-trip:
  - **Backend** (`cash-flow-backend/server/src/controllers/auditController.ts`): new `renotifyAuditor` controller and `POST /api/games/:roomCode/transactions/:txId/renotify?playerId=…` route. Validates the requester is the submitting player (403 otherwise), the transaction is still PENDING (409 otherwise), and there's an auditor assigned (409 if not). Re-emits `audit:requested` directly to the auditor's socketId (with a `renotify: true` tag) plus a `transaction:pending` room broadcast. Bumps `lastActivityAt`. Response body includes `auditorReachable: boolean` so the frontend can tell the user whether the ping landed.
  - **Frontend** (`src/services/transactionApi.ts`): new `useRenotifyTransactionMutation` RTK Query mutation. `src/components/PendingTransactionBanner.tsx`: replaced the `// TODO + console.log` with the real call — on success, dispatches the new `markRenotified` slice action (hides the button + stamps `lastRenotifiedAt`); the elapsed-time effect now anchors the 5-min cooldown on `max(submittedAt, lastRenotifiedAt)` so the cooldown restarts after each re-notify; success/warning/error notifications surface based on `auditorReachable` + HTTP status.
  - **Tests**: 7 new backend integration tests in `auditController.test.ts` (audit:requested + room broadcast emit, auditorReachable flag both ways, 403 non-submitter, 409 not-pending, 409 no-auditor, 404 missing-tx, 400 missing playerId). 4 new slice tests for `markRenotified` + `lastRenotifiedAt`. 1 new RTK Query endpoint test for `renotifyTransaction`. 5 new banner integration tests covering the round-trip success/warning/error paths plus the canRenotify-false hide. Counts: backend 149 → **156**, frontend 143 → **153**.
- [x] **10.3.5** FAB lockout — already wired at the dashboard level via `<TransactionFAB disabled={hasPendingTransaction}>`. The current implementation goes one step further than the spec ("same transaction type") and disables ALL transaction paths while any audit is pending, which is the safer behavior since the audit pipeline is single-channel anyway. Added 4 unit tests in `src/test/components/TransactionFAB.test.tsx`: not-disabled click expands the menu; disabled click does NOT expand; tooltip surfaces via the `title` attribute; disabled state applies the gray-out + cursor-not-allowed classes and the `disabled` HTML attribute.
- [x] **10.3.6** Flash-on-change animation added to `src/components/MetricCard.tsx`. When `value` changes between renders (typically after a `transaction:finalized` socket event lands and the dashboard re-fetches), the value briefly highlights with a green background that fades after 800ms. First render is excluded so mounting the dashboard doesn't flash all six cards at once. Backed by 4 unit tests in `src/test/components/MetricCard.test.tsx` using `vi.useFakeTimers()`: no flash on initial mount; flash fires on value change and clears after 900ms; same-value re-render doesn't flash; currency formatting unchanged.
- [x] **10.3.7** Rejection-form pre-fill end-to-end. `TransactionRejectedModal` is now rendered globally in `App.tsx` (alongside `SessionExpiredModal`), gated on `ui.modalOpen === 'transaction_rejected'` (which `useSocketEvents` already dispatches on a `transaction:rejected` socket event). The modal pulls `auditorNote` + `type` + `subType` + `details` from the `transaction.pendingTransaction` slice; closing it both clears the modal AND wipes the pending-transaction record so the FAB unlocks. The modal's "Edit Transaction" button navigates to the matching wizard route with `state: { rejectedData: { subType, details } }`. `BuyTransactionScreen` now reads `location.state.rejectedData` on mount: jumps to step 2 with `selectedAssetType` set from `subType` and `details` seeded from the original submission, then clears the location state so a refresh doesn't re-pre-fill from a stale rejection. Backed by 6 unit tests in `src/test/components/TransactionRejectedModal.test.tsx`: open/closed rendering; Close button calls onClose; Edit Transaction navigates to the right route per `transactionType` (5 cases — buy / sell / loan_take / loan_payoff / market_event) and stashes `rejectedData` in location.state; unknown type falls back to `/transaction/buy`.

---

## FEATURE 11: Cross-Player Visibility — UI ✅

### 11.1 Players Overview Screen
- [x] **11.1.1** Create `PlayersOverviewScreen` component
- [x] **11.1.2** Fetch all players via `getAllPlayers` RTK Query endpoint on mount
- [x] **11.1.3** Display a card for each player in the session (including self, highlighted)
- [x] **11.1.4** Each card shows: player name, profession, Cash on Hand, Cashflow, PAYDAY Amount, asset count
- [x] **11.1.5** Connection status indicator: green dot (connected), amber dot with timer (disconnected), gray with "Removed" label (removed)
- [x] **11.1.6** Rat Race / Fast Track badge on each card
- [x] **11.1.7** Tap on a card → expand inline or navigate to detail view showing: full income breakdown, expense breakdown, asset list, liability list (all read-only)
- [x] **11.1.8** Subscribe to `player:updated`, `player:disconnected`, `player:reconnected`, `player:removed` to update cards in real time

### 11.2 Activity Feed
- [x] **11.2.1** Create `ActivityFeed` component displayed within the Players Overview screen (or as a sub-tab)
- [x] **11.2.2** Fetch recent transactions via `getTransactions` on mount
- [x] **11.2.3** Each feed entry: player name (colored), transaction type icon, description, amount (green/red), relative timestamp ("2 min ago")
- [x] **11.2.4** Tap on entry to expand full transaction details (before/after values)
- [x] **11.2.5** Subscribe to `transaction:finalized`, `payday:collected`, `fasttrack:achieved` Socket.io events to prepend new entries in real time
- [x] **11.2.6** Scrollable list with load-more pagination for older entries

---

## FEATURE 12: Disconnection & Reconnection — UI ✅

### 12.1 Disconnected Player Indicators
- [x] **12.1.1** On `player:disconnected` event: update the player's card on the Players Overview screen with a "Disconnected" badge and a countdown timer showing remaining reconnection time (e.g., "14:32 remaining")
- [x] **12.1.2** On `player:reconnected`: remove the badge, flash a green "Reconnected" indicator briefly
- [x] **12.1.3** On `player:removed`: replace the card content with "Removed (disconnected)" in gray, no financial data shown

### 12.2 Auditor Disconnection Handling
- [x] **12.2.1** If the current user's auditor disconnects: show an alert/banner: "Your auditor [Name] has disconnected. Pending reviews are paused."
- [x] **12.2.2** If the auditor is removed after 15 min: show a modal prompting the user to select a new auditor (reuse `AuditorPicker`)
- [x] **12.2.3** On new auditor selection: call `reassignAuditor` API

### 12.3 Own Reconnection
- [x] **12.3.1** On app load: check if the user has a stored `roomCode` and `playerId` (in sessionStorage)
- [x] **12.3.2** If found: attempt to call `reconnectPlayer` API
- [x] **12.3.3** On success: restore full game state from API response, rejoin Socket.io room, show "Welcome back!" toast with a brief summary of missed events
- [x] **12.3.4** On failure (expired): show "Your session has expired. You were removed after 15 minutes of inactivity." with option to return to landing page

### 12.4 Session Expiry UI
- [x] **12.4.1** On `session:expiry_warning` event: display a full-width warning banner at the top: "Session will expire in 3 minutes due to inactivity. Make any action to keep playing."
- [x] **12.4.2** Show a countdown timer in the banner
- [x] **12.4.3** Banner dismisses automatically when any action resets the timer (listen for `player:updated` or `transaction:finalized`)
- [x] **12.4.4** On `session:expired` event: display a full-screen modal: "Session Expired — This game session has ended due to inactivity." Button: "Return to Home"
- [x] **12.4.5** Navigate to landing page on modal dismiss

---

## FEATURE 13: Transaction History & Undo — UI ✅

### 13.1 Transaction History Screen
- [x] **13.1.1** Create `TransactionHistoryScreen` displaying the current player's transactions
- [x] **13.1.2** Fetch via `getTransactions` with `playerId` filter
- [x] **13.1.3** Each entry: timestamp, type icon/badge, description, amount (green for gains, red for losses), audit status badge (Approved ✓, Pending ⏳, Rejected ✗)
- [x] **13.1.4** Tap entry to expand: full before/after detail, auditor name, auditor note (if rejected)
- [x] **13.1.5** Scrollable list with load-more pagination
- [x] **13.1.6** Filter/sort controls: filter by type (buy, sell, loan, payday, market event), sort by newest/oldest

### 13.2 Undo Functionality
- [x] **13.2.1** "Undo Last Transaction" button at the top of the history screen
- [x] **13.2.2** Disabled if: no eligible transactions, or a pending undo is already in flight
- [x] **13.2.3** On tap: show confirmation dialog — "Undo [transaction description]? This will reverse all financial changes and require auditor approval."
- [x] **13.2.4** Show the reversal impact (what will be restored/removed)
- [x] **13.2.5** On confirm: call `undoTransaction` API, show "Undo request sent to auditor" pending state
- [x] **13.2.6** On auditor approval of undo: update dashboard with restored values, show success toast

---

## FEATURE 14: Responsive Design & Accessibility

### 14.1 Mobile Optimization (Primary Viewport)
- [ ] **14.1.1** Audit all screens at 360px width (small Android) and 428px width (iPhone 15 Pro Max)
- [ ] **14.1.2** Verify all touch targets are ≥ 44px × 44px (buttons, cards, list items, form inputs)
- [ ] **14.1.3** Verify all forms are usable in both portrait and landscape orientation
- [x] **14.1.4** Configure number input fields with `inputMode="numeric"` and `pattern="[0-9]*"` for mobile numeric keyboards
- [ ] **14.1.5** Test scroll behavior: ensure no content is hidden behind the bottom nav bar
- [ ] **14.1.6** Verify modals and overlays work correctly on mobile (no viewport issues)

### 14.2 Tablet & Desktop
- [ ] **14.2.1** Verify sidebar nav renders at `lg` breakpoint (1024px+)
- [ ] **14.2.2** Verify metric cards layout adjusts to wider viewports (3-column, then single-row)
- [ ] **14.2.3** Verify player cards and transaction wizards use available space on larger screens
- [ ] **14.2.4** Verify FAB positioning works with sidebar nav on desktop

### 14.3 Accessibility (WCAG 2.1 AA)
- [ ] **14.3.1** Verify color contrast meets 4.5:1 ratio for all text on colored backgrounds (use Tailwind's contrast checker or axe)
- [x] **14.3.2** Add `aria-label` attributes to all icon-only buttons (FAB, nav tabs, close buttons)
- [x] **14.3.3** Add `aria-live="polite"` to dashboard metric cards (announce value changes to screen readers)
- [ ] **14.3.4** Ensure all forms have properly associated `<label>` elements
- [ ] **14.3.5** Add keyboard navigation: Tab through all interactive elements, Enter/Space to activate
- [x] **14.3.6** Add visible focus indicators (focus-visible ring) on all interactive elements
- [ ] **14.3.7** Test with screen reader (VoiceOver on iOS/macOS) for core flows: setup wizard, collect PAYDAY, buy transaction, audit review
- [ ] **14.3.8** Verify all status changes (pending, approved, rejected, Fast Track) are announced by screen readers

---

## FEATURE 15: Playwright E2E Tests

### 15.1 Test Configuration
- [ ] **15.1.1** Configure Playwright to run against local dev stack (frontend + backend + MongoDB via Docker)
- [ ] **15.1.2** Create seed scripts that set up test data before each test suite
- [ ] **15.1.3** Create helper functions: `createAndJoinGame()`, `completePlayerSetup(profession)`, `navigateToDashboard()`

### 15.2 Game Session Tests
- [ ] **15.2.1** Test: Create game → verify room code displayed → copy button works
- [ ] **15.2.2** Test: Join game with valid room code → lands on lobby → player appears in list
- [ ] **15.2.3** Test: Join game with invalid code → error message displayed
- [ ] **15.2.4** Test: 7th player attempts to join full session → "Session full" error
- [ ] **15.2.5** Test: Host clicks "Start Game" → all players navigate to dashboard

### 15.3 Player Setup Tests
- [ ] **15.3.1** Test: Complete full setup wizard (profession → dream → auditor → confirm) → lobby shows "Ready"
- [ ] **15.3.2** Test: Verify profession selection auto-populates correct starting financial data on the review screen

### 15.4 Dashboard & PAYDAY Tests
- [ ] **15.4.1** Test: Dashboard displays all 6 metrics with correct values after setup
- [ ] **15.4.2** Test: Click "Collect PAYDAY" → Cash on Hand increases by PAYDAY Amount → success toast shown
- [ ] **15.4.3** Test: Verify PAYDAY does NOT trigger auditor notification

### 15.5 Transaction Tests
- [ ] **15.5.1** Test: Buy stock → wizard flow → submit for audit → auditor approves → dashboard updates (asset appears, cash reduced, income added if dividend)
- [ ] **15.5.2** Test: Buy real estate → verify all 4 categories update after audit approval
- [ ] **15.5.3** Test: Sell an asset → verify cascading removals after approval
- [ ] **15.5.4** Test: Take $3K loan → verify cash +$3K, expense +$300, liability +$3K after approval
- [ ] **15.5.5** Test: Pay off $2K bank loan → verify cash −$2K, expense −$200, liability −$2K after approval
- [ ] **15.5.6** Test: Submit transaction → auditor rejects with note → rejection modal displayed → financial data unchanged

### 15.6 Auditor Tests
- [ ] **15.6.1** Test: Player submits → auditor's device shows notification badge → navigate to review → approve → player's dashboard updates
- [ ] **15.6.2** Test: Player submits → use handoff mode → auditor reviews on same device → approve → return to player dashboard

### 15.7 Cross-Player Tests
- [ ] **15.7.1** Test: Player A buys stock → Player B's Players Overview shows Player A's updated cash and asset count
- [ ] **15.7.2** Test: Player A collects PAYDAY → activity feed on Player B's screen shows the entry

### 15.8 Disconnection & Session Tests
- [ ] **15.8.1** Test: Close Player B's browser → Player A sees "Disconnected" indicator on Player B's card
- [ ] **15.8.2** Test: Player B reopens app within 15 min → reconnects → "Disconnected" indicator removed
- [ ] **15.8.3** Test: Room expires after 15 min inactivity → warning banner at 12 min → expiry modal at 15 min

### 15.9 Fast Track Test
- [ ] **15.9.1** Test: Build passive income above total expenses (via multiple buys) → Fast Track celebration fires → dashboard switches to Fast Track mode → other players see notification

---

## FEATURE 16: Post-Audit Follow-ups ⚠️ OPEN
> Items surfaced by the 2026-05-01 codebase audit that aren't fully captured by the existing feature tasks.

### 16.1 Shared Package Integration (extends 0.3.4)
- [x] **16.1.1** Verified the backend's `/shared` package is consumable by this repo via the existing `"@cashflow/shared": "file:../cash-flow-backend/shared"` link in `package.json`. The package's `dist/` exports `calculations`, `data`, `enums`, `types`, `utils`, and `index.{js,d.ts}` — all available to the frontend now. No publish step needed.
- [x] **16.1.2** Replaced hardcoded data duplicates with shared-package adapters: `src/constants/professions.ts` now iterates `Object.entries(sharedProfessions)` from `@cashflow/shared` and merges UI-flavor fields (description / difficulty / legacy `bankLoan` aggregate) from a small local map keyed by profession id. `src/constants/dreams.ts` is now a one-line re-export of `sharedDreams` (`Dream` aliased to `IDream`). `src/constants/stocks.ts` same — re-exports `sharedStocks`, `Stock` aliased to `IStock`. The hand-keyed copies of salary / taxes / mortgage / schoolLoan / etc. are gone — financial values now come from the single source of truth and can never drift again. (`src/types/profession.ts`'s extended `Profession` interface stays for now since it carries UI-only fields like `id`/`title`/`difficulty` that don't exist on `IProfessionData`; it's a superset, not a duplicate.)
- [x] **16.1.3** **All four transaction wizards now delegate to the shared calculation engine.** New adapter `src/utils/impactPreview.ts::previewSnapshotFromImpact(player, impact)` translates a shared `TransactionImpact` (deltas) into the `{ before, after }` preview shape `<TransactionImpactPreview>` consumes. Wired into:
  - `TakeLoanScreen` → `calculateTakeLoanImpact`
  - `PayOffLoanScreen` → `calculatePayOffLoanImpact` (with synthetic `_id`-mapped liability, since frontend `Liability` uses `id`)
  - `BuyTransactionScreen` → switch on assetType → `calculateBuyStockImpact` / `calculateBuyMutualFundImpact` / `calculateBuyCDImpact` / `calculateBuyRealEstateImpact` / `calculateBuyGoldImpact` / `calculateBuyBusinessImpact`
  - `SellTransactionScreen` → `calculateSellAssetImpact` (with synthetic asset converting frontend `costBasis` / `monthlyIncome` → shared `totalCost` / `monthlyPassiveIncome`)

  All four screens now call the same code path the backend runs on audit-approval — the preview cannot drift from what actually gets applied. Hand-rolled `calculateImpact()` math (~40 lines per screen) is gone.

  Parity tests in `src/test/utils/impactPreview.test.ts` (9 tests, all passing): TAKE LOAN, PAY OFF LOAN (full), BUY STOCK with dividend, BUY CD, BUY REAL ESTATE (down + mortgage expense), BUY GOLD (no passive income), SELL (full sell of income asset), passive-income lockstep adjustment, idle preview. Frontend test count went from 7 → 16.

### 16.2 Pending-Transaction Polish (extends 10.3)
The TODO in `src/components/PendingTransactionBanner.tsx` and the unchecked items 10.3.4–10.3.7 are the same gap. Closing 10.3.4–10.3.7 closes this.

### 16.3 Frontend Unit Test Coverage
Vitest is configured but only `transactionSlice.test.ts` exists. Add:
- [x] **16.3.1** Tests for the remaining Redux slices, **62 new tests across 5 files, all passing**:
  - `src/test/slices/gameSessionSlice.test.ts` — initial state, `setGameSession` merge, individual setters, `incrementPlayerCount` / `decrementPlayerCount` (with floor-at-zero), `resetGameSession`, plus `selectIsHost` (true / false branches) and `selectGameStatus`.
  - `src/test/slices/allPlayersSlice.test.ts` — `setAllPlayers`, `addPlayer` (idempotent on duplicate id), `updatePlayer` (merge + no-op on unknown id), `updatePlayerConnectionStatus`, `removePlayer`, `resetAllPlayers`, plus all three selectors (`selectPlayerById`, `selectConnectedPlayers`, `selectReadyPlayers`).
  - `src/test/slices/auditSlice.test.ts` — `addPendingReview` (dedup by `transactionId`), `removePendingReview` (also clears `currentReview` when it matches), `setCurrentReview`, `clearPendingReviews`, `setPendingReviews` (count auto-recomputed).
  - `src/test/slices/uiSlice.test.ts` — `setActiveTab`, expiry-warning show/hide, `selectExpiryWarning` memoized selector, notification add/remove/clear, `setReconnecting` / `setLoading`, modal open/close + replacement, `resetUI`.
  - `src/test/slices/playerSlice.test.ts` — `setPlayerData`, `updateFinancials` (recomputes `totalIncome` / `cashflow` / `paydayAmount`, flips `isOnFastTrack` at the boundary), `addIncome` / `removeIncome` (recomputes passive income excluding salary entries), expense / asset / liability mutations, `updateCashOnHand`, `collectPayday` (incrementer not setter), `setFastTrack`, `resetPlayer`, plus three selectors.
- [x] **16.3.5 (partial)** Tests for `src/utils/sessionAuth.ts` — 6 tests covering: round-trip persistence, `getSocketAuth` shape (the two fields the io.use middleware reads), null-fallback when no creds set, `setSocketAuthToken` rotation preserves other creds (the contract `ReconnectionHandler` depends on), `clearSessionCredentials` wipes all four keys, and clear leaves unrelated sessionStorage keys intact.
- [x] **16.3.2** Tests for `useSocketEvents` hook — `src/test/hooks/useSocketEvents.test.tsx`, **9 tests, all passing**. Strategy: capture-only mock of the `socketService` singleton via `vi.mock` so `onEvent(name, handler)` stashes each handler in a `Map`; render the hook against a freshly-built test store; invoke each captured handler with a representative payload and assert the slice mutations land. Coverage: `payday:collected` (the regression test for the PAYDAY incrementer bug — would have caught it), `player:updated`, `player:disconnected`, `player:reconnected`, `player:removed`, `fasttrack:achieved`, `session:expired` (modal + status flip), `session:expiry_warning` (banner state), `player:joined`. Frontend test count went 16 → 25.
- [x] **16.3.3** Tests for `services/socketService.ts` — `src/test/services/socketService.test.ts`, **14 tests, all passing**. Mocks `socket.io-client`'s `io()` factory to capture options. Coverage: auth wiring (passes `playerId` + `socketAuthToken` from sessionStorage; sends undefined when none persisted; rejects immediately on `connect_error: "Unauthorized"`; does NOT reject on transient errors); reconnection options (attempts/delay caps, polling→websocket transport upgrade); room management (`joinRoom` with + without playerId; no-op when not connected; `leaveRoom` emits + forgets); event subscription (`onEvent`/`offEvent`-with-callback / `offEvent`-without-callback); `disconnect` lifecycle.
- [x] **16.3.4** Tests for RTK Query endpoints — `src/test/services/api.test.ts`, **14 tests, all passing**. Stubs global `fetch` to capture each request's URL / method / body / headers (handles both string-URL and Request-object call shapes RTK Query uses). Coverage:
  - **gameApi**: createGame, joinGame, startGame, reconnectPlayer (asserts `socketId` body field — the one the route validator requires; missing it was a latent bug we fixed in 16.6.1), reassignAuditor, submitMarketEvent.
  - **transactionApi**: submitTransaction, auditTransaction (with note + without — the conditional spread), undoTransaction, getTransactions (filters in URL query params, response transform unwraps the `{transactions: […]}` envelope).
  - **apiSlice 410 baseQuery wrapper** (16.6.4): a 410 response wipes all four sessionStorage credentials AND opens the `session_expired` modal; non-410 errors leave the modal closed. Pinned end-to-end at the slice layer.
- Bonus: stripped two `console.log` / `console.warn` debug calls from `transactionApi.ts` (`[AUDIT API] Request:` log and `[transactionApi] Unexpected response format:` warn). Test output is now clean of those.
- [ ] **16.3.5** Tests for any pure helpers in `src/utils/`.

### 16.4 E2E Test Implementation (executes Feature 15)
Tasks 15.2.1–15.9.1 are defined but only 2 specs exist. Prioritize, in this order:
- [x] **16.4.1** `e2e/game-session.spec.ts` — covers 15.2.1–15.2.5: create-game shows room code with copy button; join valid room → lobby; invalid room code error; 7th player into a full session sees "full"; host clicks Start → both players navigate to dashboard. **5 specs, all `.skip()` pending CI backend.**
- [x] **16.4.2** `e2e/player-setup.spec.ts` — covers 15.3.1–15.3.2: full wizard (profession → dream → auditor → confirm) lands player in "Ready"; engineer profession populates correct starting financial data on the review screen ($4,900 salary, $400 cash, $2,710 expenses, $2,190 PAYDAY — values cross-checked against `@cashflow/shared`). **2 specs, all `.skip()`.**
- [x] **16.4.3** `e2e/dashboard-payday.spec.ts` — covers 15.4.1–15.4.3: dashboard renders all 6 metric cards with correct values; Collect PAYDAY adds the right amount to cash + shows toast; PAYDAY does NOT trigger an auditor notification (auditStatus=NOT_REQUIRED). **3 specs, all `.skip()`.**
- [x] **16.4.4** `e2e/transactions.spec.ts` (15.5.1–15.5.5) + `e2e/real-estate-mortgage.spec.ts` (15.5.6 — already landed). New file covers: buy stock with dividend (cash + asset + passive income); sell stock full (cash + passive income reverses); take $3K loan (cash +3000, expenses +300); pay off $2K (cash -2000, expenses -200); auditor rejects with note (rejection modal + unchanged financials). **5 specs, all `.skip()` pending CI backend.**
- [x] **16.4.5** `e2e/auditor-modes.spec.ts` — covers 15.6.1–15.6.2: remote audit (separate-device flow with notification badge, approve, buyer dashboard updates via socket); handoff audit (same-device flow with "AUDITOR REVIEW" header, approve, "Return to Player" navigates back). **2 specs, all `.skip()`.**
- [x] **16.4.6** `e2e/cross-player.spec.ts` — covers 15.7.1–15.7.2 with multi-context Playwright: Player A buys + audit-approves → Player B's overview reflects new cash + asset count via `player:updated` socket event; Player A collects PAYDAY → activity feed on Player B prepends entry via `payday:collected` event. **2 specs, all `.skip()`.**
- [x] **16.4.7** `e2e/disconnect-reconnect.spec.ts` (15.8.1–15.8.2) + `e2e/session-expiry.spec.ts` (15.8.3 — already landed, route-injection-style). New file covers: closing a player's tab surfaces a "Disconnected" indicator on other players' overview (via `player:disconnected` socket event); reconnect within 15-min window restores the session via `ReconnectionHandler` calling `/reconnect` and clears the indicator on observers via `player:reconnected`. **2 specs, all `.skip()`.**
- [x] **16.4.8** `e2e/fast-track.spec.ts` — covers 15.9.1: passive income exceeds expenses → next PAYDAY collection flips `isOnFastTrack`, fires `fasttrack:achieved` socket event → celebration on the winner's screen + notification toast on every other player's screen + Fast Track banner on dashboard. **1 spec, `.skip()`.**

**Playwright spec total**: **12 files / 32 specs / 96 tests** across the 3 device projects (chromium, Mobile Chrome, Mobile Safari). Of these, 1 spec runs without a backend (`session-expiry.spec.ts` via route injection); the rest are scaffolds awaiting CI backend integration. All parse cleanly via `npx playwright test --list`.

### 16.7 Buy → Loan deep-link with suggested amount (user-reported, 2026-05-02)
- [x] User reported: when a buy transaction's cost exceeds cash on hand, the transaction silently fails with no clear path forward. Fix: extended the existing buy → loan handoff to include a suggested amount and pre-fill the loan stepper.
  - `src/screens/BuyTransactionScreen.tsx`: extracted `handleTakeLoanForPurchase` that computes the shortfall, rounds up to the nearest $1,000 (the bank-loan validator's increment), saves the in-progress purchase to `sessionStorage.pendingPurchase` (the existing restore effect on mount replays the form when the user comes back), and navigates to `/transaction/loan?suggested=<amount>`. Replaced the bare "Insufficient funds" warning on Step 2 with a yellow gate banner that includes a "Take $X,XXX loan →" button. Step 3's submit button now shows the exact suggested amount in its label ("💰 Take $3,000 loan" instead of "💰 Take a Loan").
  - `src/screens/TakeLoanScreen.tsx`: added a `useSearchParams()` reader that parses `?suggested=<dollars>` on mount (and on URL change) and pre-fills `loanIncrements`. Defaults to 1 increment when missing or invalid. Clamps to `[1, 50]` (the existing MAX_INCREMENTS).
  - Added `data-testid="loan-amount"` to the big loan-amount display so tests can target it without ambiguity.
  - 7 new unit tests in `src/test/screens/TakeLoanScreen-suggested.test.tsx` cover the deep-link param: no param → default $1,000; exact match $3,000; rounding ($2,500 → $3,000); under-min ($999 → $1,000); over-cap ($999,999 → $50,000); non-numeric → default; zero → default. Frontend test count: 153 → **160**.

### 16.6 Backend Contract Sync — Three Blockers Landed (added 2026-05-01)
The backend's recent overhaul shifted three contracts the frontend was either ignoring or actively reading wrong. All three have been fixed:

- [x] **16.6.1** **Socket authentication wired up.** Backend now requires `auth: { playerId, socketAuthToken }` on every Socket.io connect (Feature 16.2.3 backend) — without it, `connect_error: "Unauthorized"`. New helper `src/utils/sessionAuth.ts` persists the credentials. `src/services/socketService.ts` reads them on every `connect()` and passes `auth: {...}` to `io()`. The token is captured from the response body of `createGame` (`src/screens/CreateGameScreen.tsx`), `joinGame` (`src/screens/JoinGameScreen.tsx`), and `reconnect` (`src/components/ReconnectionHandler.tsx`); the rotated token from `/reconnect` is overwritten via `setSocketAuthToken`. RTK Query response types updated in `src/services/gameApi.ts` for all three mutations. The reconnect mutation also now passes the required `socketId` field (was missing — backend route validator was rejecting every reconnect with 400). The socket service surfaces an immediate rejection on `Unauthorized` instead of looping the reconnect schedule.
- [x] **16.6.2** **Downsized loan-gate handled.** Backend now returns `409 { requiresLoan: true, shortfall, suggestedLoan, totalExpenses, cashOnHand }` when a player can't cover the month's expenses (Feature 16.5.4 backend). `MarketEventScreen.tsx`'s downsized branch catches the 409, stashes `suggestedLoan` in component state, and shows a deep-link button (`Take $X loan →`) that navigates to `/transaction/loan?suggested=<amount>` so the user takes exactly the amount needed. The previous client-side `hasInsufficientFunds` heuristic is kept as a pre-submit nudge, but the authoritative gate is now the backend.
- [x] **16.6.5** **Production console.log noise reduced.** Introduced `src/utils/devLog.ts` — a one-liner that no-ops in production via `import.meta.env.DEV`. Replaced 32 chatty `console.log` calls across the three noisiest files (`src/services/socketService.ts`, `src/hooks/useSocketEvents.ts`, `src/services/gameApi.ts`) with `devLog`. `console.error` calls are kept (intentional production telemetry). Vite tree-shakes the `if (DEV)` branch out of production builds, so the prod bundle is silent.
- [x] **16.6.4** **410 session-expiry handling on all writes.** Backend now returns `410 { error: 'Game expired', message }` from the `trackActivity` middleware on any write against an expired session (Feature 16.5.3 backend). Wrapped the RTK Query `fetchBaseQuery` in `src/services/api.ts` so any 410 response — regardless of which mutation triggered it — clears the per-tab credentials via `clearSessionCredentials()` and dispatches `openModal('session_expired')`. The existing `SessionExpiredModal` already renders off `ui.modalOpen === 'session_expired'` in `App.tsx`, so no UI work needed beyond the wrapper. Idempotent: dispatching `openModal` twice just re-sets the same string.
- [x] **16.6.3** **PAYDAY socket handler bug fixed.** `src/hooks/useSocketEvents.ts::handlePaydayCollected` was writing `data.amount` (the PAYDAY value, e.g. $2,400) into `cashOnHand`, *replacing* the post-credit total instead of crediting it. Other players' overview screens showed the wrong value after every PAYDAY (the collecting player's own dashboard re-fetched and hid the bug). Now uses `data.newCashOnHand` from the backend payload (which the controller has always included). The `payday:collected` payload type in `socketService.ts` updated to include `newCashOnHand: number`.

Type-check clean (`npx tsc -p tsconfig.app.json --noEmit`); existing 7 unit tests still pass.

Remaining frontend work for the rest of the backend-drift list (`410 on writes`, `requiresLoan` type still on success path, Undo `details` shape, console.logs, hardcoded shared-package types) is captured in the audit notes — not yet shipped.

### 16.5 Responsive & A11y Audits (executes Feature 14.1–14.3)
The 14.x items already capture this work; track them here as the priority block.
- [ ] **16.5.1** Run formal responsive pass at 360px / 428px / 768px / 1024px+ and capture findings (closes 14.1.1, 14.1.2, 14.1.5, 14.1.6, 14.2.1–14.2.4).
- [ ] **16.5.2** Run axe / Lighthouse a11y audit; fix contrast violations (closes 14.3.1).
- [ ] **16.5.3** Add `<label>` associations to every form input (closes 14.3.4).
- [ ] **16.5.4** Verify Tab/Enter/Space keyboard navigation across all interactive elements (closes 14.3.5).
- [ ] **16.5.5** VoiceOver pass on setup wizard, PAYDAY, buy transaction, audit review (closes 14.3.7, 14.3.8).

---

## Implementation Order (Recommended)

| Sprint | Features | Focus |
|--------|----------|-------|
| **1** | 0 (Setup), 1 (API Client/Socket), 2 (Redux) | Foundation: React app, API client, state management, Socket.io integration |
| **2** | 3 (Create/Join), 4 (Setup Wizard) | Core UX: game creation, lobby, player setup flows |
| **3** | 5 (Dashboard + PAYDAY + Nav) | Primary game screen: metrics, PAYDAY, navigation, detail screens |
| **4** | 6 (Buy Wizard), 7 (Sell Wizard) | Core transaction UIs |
| **5** | 8 (Loan Wizard), 9 (Market Events) | Remaining transaction UIs |
| **6** | 10 (Auditor Review — both modes) | Remote audit + handoff audit + pending states |
| **7** | 11 (Players Overview + Feed), 13 (History/Undo) | Cross-player views + transaction history |
| **8** | 12 (Disconnection UI), Feature 12.4 (Session Expiry UI) | Resilience UI |
| **9** | 14 (Responsive/A11y), 15 (Playwright E2E) | Polish, accessibility audit, full E2E test suite |
| **10** | 16 (Post-Audit Follow-ups) | Shared types, pending-tx polish, unit/E2E test coverage, formal a11y/responsive pass |

---

*Total frontend tasks: 261/315 core complete + ~24 follow-ups in Feature 16*
*Generated from Cashflow Calculator PRD v2.2 — last reviewed 2026-05-01*
