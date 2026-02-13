# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Cashflow Calculator Frontend** - a React-based web application implementing the classic Cashflow board game as a digital multiplayer experience. The frontend is built with React, Redux Toolkit, Tailwind CSS, and Socket.io for real-time multiplayer functionality.

## Key Architecture

### Tech Stack
- **React + TypeScript** with Vite as the build tool
- **Redux Toolkit** for state management with RTK Query for API calls
- **Socket.io Client** for real-time multiplayer synchronization
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Playwright** for E2E testing

### Dependencies
This frontend depends on a shared package from the backend containing:
- TypeScript types and interfaces
- Calculation engine for financial computations
- Game logic constants

### Core Game Concepts
- **Game Sessions**: 6-player multiplayer rooms with unique room codes
- **Player Setup**: Profession selection, dream selection, auditor assignment
- **Financial Tracking**: Income, expenses, assets, liabilities, cashflow
- **Transactions**: Buy/sell assets, take/pay loans, market events - all require auditor approval
- **Audit System**: Each player has an assigned auditor who reviews transactions
- **Fast Track**: Players escape "Rat Race" when passive income exceeds expenses

## Development Commands

```bash
# Initial setup (when starting)
npm install                    # Install dependencies
npm run dev                    # Start dev server (typically on port 5173)

# Development
npm run build                  # Build for production
npm run preview               # Preview production build
npm run lint                  # Run ESLint
npm run format                # Format code with Prettier

# Testing (once configured)
npm run test:unit             # Run Vitest unit tests
npm run test:e2e              # Run Playwright E2E tests
npm run test:e2e:headed       # Run Playwright with browser UI
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── screens/         # Full-page screen components
├── store/           # Redux slices and store configuration
├── services/        # API client (RTK Query) and Socket.io service
├── hooks/           # Custom React hooks
├── utils/           # Frontend utility functions
├── types/           # Local TypeScript type extensions
└── constants/       # UI constants (colors, routes, etc.)
```

## Key Routes

- `/` - Landing page (Create/Join game)
- `/game/:roomCode/lobby` - Pre-game lobby
- `/game/:roomCode/setup` - Player setup wizard
- `/game/:roomCode/dashboard` - Main game dashboard
- `/game/:roomCode/players` - All players overview
- `/game/:roomCode/income` - Income details
- `/game/:roomCode/expenses` - Expense details
- `/game/:roomCode/assets` - Asset details
- `/game/:roomCode/liabilities` - Liability details
- `/game/:roomCode/history` - Transaction history
- `/game/:roomCode/transaction/:type` - Transaction wizards

## State Management Architecture

### Redux Slices
- **gameSessionSlice**: Room code, game status, host info, current player ID
- **playerSlice**: Current player's full financial data
- **allPlayersSlice**: Summary data for all players in session
- **auditSlice**: Pending audit reviews for current user
- **transactionSlice**: Pending transactions and history
- **uiSlice**: UI state, notifications, connection status

### RTK Query Endpoints
- Game management: create, join, start games
- Player operations: setup, get data, collect payday
- Transactions: submit, audit, undo
- Real-time sync via Socket.io events

## Socket.io Event Handling

The app listens for these real-time events:
- `player:joined` - New player enters lobby
- `game:started` - Game transitions from lobby to active
- `transaction:pending` - Transaction needs audit review
- `transaction:finalized` - Transaction approved
- `transaction:rejected` - Transaction rejected by auditor
- `payday:collected` - Player collected payday
- `player:updated` - Player data changed
- `player:disconnected/reconnected` - Connection status changes
- `fasttrack:achieved` - Player reached Fast Track
- `session:expiry_warning/expired` - Inactivity warnings

## UI/UX Principles

### Mobile-First Design
- Primary viewport: 360px (small Android) to 428px (iPhone)
- All touch targets ≥ 44px × 44px
- Bottom navigation on mobile, sidebar on desktop (≥1024px)
- Number inputs use `inputMode="numeric"` for mobile keyboards

### Color Scheme
- Income/Positive: `#2E7D32` (green)
- Expense/Negative: `#C62828` (red)
- Neutral: `#2D6A9F` (blue)
- Pending: `#F9A825` (amber)
- Background: `#F5F5F5`, `#E0E0E0`, `#333333`

### Transaction Flow Pattern
1. User initiates transaction via FAB or detail screen
2. Step-by-step wizard collects details
3. Preview shows financial impact
4. Submit for audit or handoff to auditor
5. Auditor reviews and approves/rejects
6. Real-time update via Socket.io

## Development Workflow

### Starting a New Feature
1. Check Cashflow_Frontend_Tasks.md for task details
2. Create feature branch from latest main
3. Implement components in appropriate directory
4. Add Redux slice/actions if state management needed
5. Connect Socket.io events if real-time updates required
6. Style with Tailwind using defined color palette
7. Test on mobile viewport first
8. Add Playwright E2E tests for critical paths

### Component Development Pattern
```typescript
// Use functional components with TypeScript
interface ComponentProps {
  // Define props
}

export const Component: React.FC<ComponentProps> = ({ props }) => {
  // Use hooks for state and side effects
  // Connect to Redux with typed hooks
  // Return JSX with Tailwind classes
};
```

### API Integration Pattern
```typescript
// Define endpoints in RTK Query slice
// Use generated hooks in components
// Handle loading, error, and success states
// Invalidate cache tags after mutations
```

## Testing Strategy

### Unit Tests (Vitest)
- Test Redux reducers and selectors
- Test utility functions
- Test custom hooks with renderHook

### E2E Tests (Playwright)
- Test complete user flows
- Test multiplayer interactions
- Test audit workflows
- Test disconnection/reconnection

## Current Implementation Status

The project is in the initial planning phase. The Cashflow_Frontend_Tasks.md file contains approximately 260 detailed tasks organized into 15 features, recommended to be implemented across 9 sprints. Key features include project setup, API integration, state management, all game screens, transaction wizards, audit system, cross-player visibility, and comprehensive testing.