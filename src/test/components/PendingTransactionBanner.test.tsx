import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PendingTransactionBanner } from '@/components/PendingTransactionBanner'
import { apiSlice } from '@/services/api'
import gameSessionReducer from '@/store/slices/gameSessionSlice'
import playerReducer from '@/store/slices/playerSlice'
import allPlayersReducer from '@/store/slices/allPlayersSlice'
import auditReducer from '@/store/slices/auditSlice'
import transactionReducer, {
  setPendingTransaction,
  enableRenotify,
} from '@/store/slices/transactionSlice'
import uiReducer from '@/store/slices/uiSlice'
import type { Transaction } from '@/services/transactionApi'

/**
 * Tests for the re-notify wiring in PendingTransactionBanner (10.3.4).
 * The fetch stub captures the request the RTK Query mutation makes; we
 * verify the URL/method, the success-path notification, and the slice
 * state mutation (markRenotified hides the button + stamps the cooldown
 * anchor).
 */

const mockTransaction: Transaction = {
  id: 'tx-1',
  roomCode: 'ABCDEF',
  type: 'buy',
  status: 'pending',
  timestamp: new Date().toISOString(),
  playerId: 'player-1',
  details: {},
}

function buildStore() {
  const store = configureStore({
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
  // Pre-load: pending transaction + canRenotify=true (5 min has elapsed)
  store.dispatch(setPendingTransaction(mockTransaction))
  store.dispatch(enableRenotify())
  return store
}

function renderBanner(store: ReturnType<typeof buildStore>) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/game/ABCDEF/dashboard']}>
        <Routes>
          <Route path="/game/:roomCode/dashboard" element={<PendingTransactionBanner />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('PendingTransactionBanner — re-notify (10.3.4)', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    sessionStorage.clear()
    sessionStorage.setItem('playerId', 'player-1')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('clicking the button hits POST /transactions/:id/renotify with the right query param', async () => {
    fetchSpy = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            message: 'Auditor re-notified',
            transactionId: 'tx-1',
            auditorPlayerId: 'p2',
            auditorReachable: true,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const store = buildStore()
    renderBanner(store)

    const btn = await screen.findByRole('button', { name: /re-notify auditor/i })
    fireEvent.click(btn)

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce())
    const req = fetchSpy.mock.calls[0][0] as Request
    expect(req.method).toBe('POST')
    expect(req.url).toMatch(/\/transactions\/tx-1\/renotify\?playerId=player-1$/)

    // After success, the banner hides the button (canRenotify reset) and
    // the slice stamps lastRenotifiedAt so the 5-min cooldown restarts.
    await waitFor(() => {
      const state = store.getState()
      expect(state.transaction.canRenotify).toBe(false)
      expect(state.transaction.lastRenotifiedAt).toBeTypeOf('number')
    })
  })

  it('shows a success notification when the auditor is reachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ auditorReachable: true, transactionId: 'tx-1' }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
      ),
    )

    const store = buildStore()
    renderBanner(store)

    fireEvent.click(await screen.findByRole('button', { name: /re-notify auditor/i }))

    await waitFor(() => {
      const notifs = store.getState().ui.notifications
      expect(notifs.some((n) => n.type === 'success' && /re-notified/i.test(n.message))).toBe(true)
    })
  })

  it('shows a warning notification when the auditor is offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ auditorReachable: false, transactionId: 'tx-1' }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
      ),
    )

    const store = buildStore()
    renderBanner(store)

    fireEvent.click(await screen.findByRole('button', { name: /re-notify auditor/i }))

    await waitFor(() => {
      const notifs = store.getState().ui.notifications
      expect(notifs.some((n) => n.type === 'warning' && /offline/i.test(n.message))).toBe(true)
    })
  })

  it('shows an error notification on API failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: 'Unauthorized', message: 'Only the submitter can re-notify' }),
            { status: 403, headers: { 'content-type': 'application/json' } },
          ),
      ),
    )

    const store = buildStore()
    renderBanner(store)

    fireEvent.click(await screen.findByRole('button', { name: /re-notify auditor/i }))

    await waitFor(() => {
      const notifs = store.getState().ui.notifications
      expect(
        notifs.some((n) => n.type === 'error' && /only the submitter|unauthorized/i.test(n.message)),
      ).toBe(true)
    })
  })

  it('button is hidden when canRenotify is false (cooldown not yet elapsed)', () => {
    const store = configureStore({
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
    store.dispatch(setPendingTransaction(mockTransaction))
    // canRenotify NOT enabled

    renderBanner(store)
    expect(screen.queryByRole('button', { name: /re-notify auditor/i })).not.toBeInTheDocument()
  })
})
