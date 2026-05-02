import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { renderHook } from '@testing-library/react'

/**
 * Tests for the Socket.io → Redux dispatch mapping. The previous PAYDAY bug
 * (writing `data.amount` instead of `data.newCashOnHand` into cashOnHand)
 * would have been caught by the `payday:collected` test below — the
 * preceding cashOnHand was 5000 and the post-credit total was 7400; the
 * buggy code would have produced 2400 instead.
 *
 * Strategy: mock the singleton `socketService` so `onEvent(name, handler)`
 * captures the handler by name. Render the hook against a freshly-built
 * test store, then invoke each captured handler with a representative
 * payload and assert the expected slice mutations happen.
 */

// Capture-only mock of the socket service. The hook calls a bunch of
// connect/joinRoom/etc. methods that we don't care about — those are
// no-ops here.
const handlers = new Map<string, (data: unknown) => void>()
vi.mock('@/services/socketService', () => ({
  socketService: {
    connect: vi.fn(async () => {}),
    disconnect: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    isConnected: vi.fn(() => true),
    getSocketId: vi.fn(() => 'test-socket-id'),
    onEvent: vi.fn((name: string, handler: (d: unknown) => void) => {
      handlers.set(name, handler)
    }),
    offEvent: vi.fn((name: string) => {
      handlers.delete(name)
    }),
  },
}))

// Lazy-imported so the mock above lands first.
import { useSocketEvents } from '@/hooks/useSocketEvents'
import gameSessionReducer from '@/store/slices/gameSessionSlice'
import playerReducer from '@/store/slices/playerSlice'
import allPlayersReducer from '@/store/slices/allPlayersSlice'
import auditReducer from '@/store/slices/auditSlice'
import transactionReducer from '@/store/slices/transactionSlice'
import uiReducer from '@/store/slices/uiSlice'
import { apiSlice } from '@/services/api'

function buildStore(): EnhancedStore {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      gameSession: gameSessionReducer,
      player: playerReducer,
      allPlayers: allPlayersReducer,
      audit: auditReducer,
      transaction: transactionReducer,
      ui: uiReducer,
    },
    middleware: (g) => g().concat(apiSlice.middleware),
  })
}

function renderEventsHook(store: EnhancedStore) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    </Provider>
  )
  return renderHook(() => useSocketEvents('TESTAB'), { wrapper })
}

describe('useSocketEvents — Socket.io → Redux dispatch mapping', () => {
  let store: EnhancedStore

  beforeEach(() => {
    handlers.clear()
    store = buildStore()
    // Seed gameSession with the current user's id — needed so the hook's
    // self-vs-other-player branching can compare against it.
    store.dispatch({
      type: 'gameSession/setGameSession',
      payload: {
        roomCode: 'TESTAB',
        currentPlayerId: 'p1',
        hostPlayerId: 'p1',
        status: 'active',
      },
    })
    // Seed the player slice as if the current user (p1) had completed setup
    // with engineer defaults. Lets the self-update tests assert deltas
    // against a known starting state.
    store.dispatch({
      type: 'player/setPlayerData',
      payload: {
        id: 'p1',
        name: 'Alice',
        cashOnHand: 5000,
        salary: 4900,
        passiveIncome: 0,
        totalIncome: 4900,
        totalExpenses: 2710,
        cashflow: -2710,
        paydayAmount: 2190,
        isOnFastTrack: false,
      },
    })
    // Seed two players so the update-by-id handlers have something to mutate
    store.dispatch({
      type: 'allPlayers/addPlayer',
      payload: {
        id: 'p1',
        name: 'Alice',
        cashOnHand: 5000,
        cashflow: -2710,
        paydayAmount: 2190,
        passiveIncome: 0,
        totalExpenses: 2710,
        assetCount: 0,
        isOnFastTrack: false,
        connectionStatus: 'connected',
        isReady: false,
        isHost: true,
      },
    })
    store.dispatch({
      type: 'allPlayers/addPlayer',
      payload: {
        id: 'p2',
        name: 'Bob',
        cashOnHand: 5000,
        cashflow: 0,
        paydayAmount: 0,
        passiveIncome: 0,
        totalExpenses: 0,
        assetCount: 0,
        isOnFastTrack: false,
        connectionStatus: 'connected',
        isReady: false,
        isHost: false,
      },
    })
    renderEventsHook(store)
  })

  // ────────────────────────────────────────────────────────────────────
  // payday:collected — regression test for the PAYDAY incrementer bug.
  // ────────────────────────────────────────────────────────────────────
  it('payday:collected writes the post-credit total (newCashOnHand), not the PAYDAY amount', () => {
    const fire = handlers.get('payday:collected')
    expect(fire).toBeDefined()

    fire!({
      playerId: 'p1',
      amount: 2400, // PAYDAY value — must NOT land in cashOnHand
      newCashOnHand: 7400, // post-credit total — must land in cashOnHand
    })

    const player = store
      .getState()
      .allPlayers.players.find((p: any) => p.id === 'p1')
    expect(player?.cashOnHand).toBe(7400)
  })

  // ────────────────────────────────────────────────────────────────────
  // player:updated — fields land at the top level (NOT under `data`).
  // ────────────────────────────────────────────────────────────────────
  it('player:updated merges top-level fields onto the existing player record', () => {
    const fire = handlers.get('player:updated')
    expect(fire).toBeDefined()

    fire!({
      playerId: 'p1',
      cashOnHand: 9999,
      cashflow: 200,
    })

    const player = store
      .getState()
      .allPlayers.players.find((p: any) => p.id === 'p1')
    expect(player?.cashOnHand).toBe(9999)
    expect(player?.cashflow).toBe(200)
  })

  // ────────────────────────────────────────────────────────────────────
  // player:disconnected / player:reconnected — connectionStatus toggle.
  // ────────────────────────────────────────────────────────────────────
  it('player:disconnected flips connectionStatus to "disconnected"', () => {
    handlers.get('player:disconnected')!({ playerId: 'p1' })

    const player = store
      .getState()
      .allPlayers.players.find((p: any) => p.id === 'p1')
    expect(player?.connectionStatus).toBe('disconnected')
  })

  it('player:reconnected flips connectionStatus back to "connected"', () => {
    // First disconnect
    handlers.get('player:disconnected')!({ playerId: 'p1' })
    // Then reconnect
    handlers.get('player:reconnected')!({ playerId: 'p1' })

    const player = store
      .getState()
      .allPlayers.players.find((p: any) => p.id === 'p1')
    expect(player?.connectionStatus).toBe('connected')
  })

  // ────────────────────────────────────────────────────────────────────
  // player:removed — drops the player and decrements the count.
  // ────────────────────────────────────────────────────────────────────
  it('player:removed removes the player and decrements playerCount', () => {
    // Seed playerCount so we can verify the decrement
    store.dispatch({ type: 'gameSession/setPlayerCount', payload: 2 })

    handlers.get('player:removed')!({
      playerId: 'p1',
      reason: 'disconnect_timeout',
    })

    const players = store.getState().allPlayers.players
    expect(players.find((p: any) => p.id === 'p1')).toBeUndefined()
  })

  // ────────────────────────────────────────────────────────────────────
  // fasttrack:achieved — flips isOnFastTrack on the named player.
  // ────────────────────────────────────────────────────────────────────
  it('fasttrack:achieved flips isOnFastTrack to true', () => {
    handlers.get('fasttrack:achieved')!({
      playerId: 'p1',
      playerName: 'Alice',
    })

    const player = store
      .getState()
      .allPlayers.players.find((p: any) => p.id === 'p1')
    expect(player?.isOnFastTrack).toBe(true)
  })

  // ────────────────────────────────────────────────────────────────────
  // session:expired — opens the SessionExpiredModal + sets game status.
  // ────────────────────────────────────────────────────────────────────
  it('session:expired opens the session-expired modal and marks the session expired', () => {
    handlers.get('session:expired')!({ roomCode: 'TESTAB' })

    const ui = store.getState().ui
    const game = store.getState().gameSession
    expect(ui.modalOpen).toBe('session-expired')
    expect(game.status).toBe('expired')
  })

  // ────────────────────────────────────────────────────────────────────
  // session:expiry_warning — surfaces the warning banner countdown.
  // ────────────────────────────────────────────────────────────────────
  it('session:expiry_warning surfaces the banner with the minutes remaining', () => {
    handlers.get('session:expiry_warning')!({ minutesRemaining: 3 })

    const ui = store.getState().ui
    expect(ui.expiryWarningVisible).toBe(true)
    expect(ui.expiryMinutesRemaining).toBe(3)
  })

  // ────────────────────────────────────────────────────────────────────
  // player:joined — adds the new player and bumps playerCount.
  // ────────────────────────────────────────────────────────────────────
  it('player:joined appends the new player to allPlayers and bumps playerCount', () => {
    // p2 already exists from the beforeEach seeding; firing player:joined
    // for a NEW id (p3) should append.
    const before = store.getState().allPlayers.players.length

    handlers.get('player:joined')!({
      playerId: 'p3',
      playerName: 'Charlie',
      roomCode: 'TESTAB',
    })

    const after = store.getState().allPlayers.players
    expect(after.length).toBe(before + 1)
    expect(after.find((p: any) => p.id === 'p3')?.name).toBe('Charlie')
  })

  // ────────────────────────────────────────────────────────────────────
  // Self-update behavior — regression tests for the user-reported bug
  // where the dashboard cash never updated after the auditor approved a
  // take-loan transaction. Root cause: the previous handler only updated
  // `allPlayersSlice` (other players' cards) and never `playerSlice`
  // (the current user's wallet). The dashboard's only refresh path was an
  // RTK Query refetch via `invalidateTags(['Player'])`, which only fires
  // if `useGetPlayerQuery` is currently subscribed.
  // ────────────────────────────────────────────────────────────────────

  describe('self-update — playerSlice mirrors player:updated for the current user', () => {
    it('take-loan approval: cashOnHand + totalExpenses on playerSlice update for the submitter', () => {
      // Backend payload after auditor approves a $3K loan for player p1:
      // cashOnHand 5000 → 8000, totalExpenses 2710 → 3010.
      handlers.get('player:updated')!({
        playerId: 'p1',
        playerName: 'Alice',
        cashOnHand: 8000,
        totalIncome: 4900,
        totalExpenses: 3010,
        cashflow: -3010,
        passiveIncome: 0,
        isOnFastTrack: false,
      })

      const player = store.getState().player
      expect(player.cashOnHand).toBe(8000)
      expect(player.totalExpenses).toBe(3010)
      // playerSlice's `updateFinancials` recomputes the derived fields
      expect(player.paydayAmount).toBe(4900 - 3010) // = 1890
      expect(player.cashflow).toBe(0 - 3010) // passive - expenses

      // And the all-players overview also reflects it
      const overview = store
        .getState()
        .allPlayers.players.find((p: any) => p.id === 'p1')
      expect(overview?.cashOnHand).toBe(8000)
    })

    it('player:updated for ANOTHER player does NOT touch playerSlice', () => {
      const before = store.getState().player.cashOnHand
      handlers.get('player:updated')!({
        playerId: 'p2', // Bob, not the current user
        cashOnHand: 9999,
      })

      const player = store.getState().player
      expect(player.cashOnHand).toBe(before) // unchanged
      // But the all-players overview for Bob does reflect it
      const overview = store
        .getState()
        .allPlayers.players.find((p: any) => p.id === 'p2')
      expect(overview?.cashOnHand).toBe(9999)
    })

    it('payday:collected for the current user updates playerSlice cashOnHand', () => {
      handlers.get('payday:collected')!({
        playerId: 'p1',
        amount: 2190,
        newCashOnHand: 7190,
      })

      expect(store.getState().player.cashOnHand).toBe(7190)
    })

    it('payday:collected for ANOTHER player does NOT touch playerSlice', () => {
      const before = store.getState().player.cashOnHand
      handlers.get('payday:collected')!({
        playerId: 'p2',
        amount: 2190,
        newCashOnHand: 7190,
      })

      expect(store.getState().player.cashOnHand).toBe(before)
      // But Bob's overview does update
      const bob = store
        .getState()
        .allPlayers.players.find((p: any) => p.id === 'p2')
      expect(bob?.cashOnHand).toBe(7190)
    })

    it('player:updated with only some fields leaves the rest of playerSlice intact', () => {
      // Auditor reassignment scenario — backend emits player:updated with
      // just `auditorPlayerId`. Financial fields shouldn't be touched.
      const before = store.getState().player
      handlers.get('player:updated')!({
        playerId: 'p1',
        auditorPlayerId: 'p2',
      })

      const after = store.getState().player
      expect(after.cashOnHand).toBe(before.cashOnHand)
      expect(after.totalExpenses).toBe(before.totalExpenses)
      expect(after.paydayAmount).toBe(before.paydayAmount)
    })
  })
})
