import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import TakeLoanScreen from '@/screens/TakeLoanScreen'
import { apiSlice } from '@/services/api'
import gameSessionReducer from '@/store/slices/gameSessionSlice'
import playerReducer, { setPlayerData } from '@/store/slices/playerSlice'
import allPlayersReducer from '@/store/slices/allPlayersSlice'
import auditReducer from '@/store/slices/auditSlice'
import transactionReducer from '@/store/slices/transactionSlice'
import uiReducer from '@/store/slices/uiSlice'

/**
 * Tests for the `?suggested=<dollars>` deep-link param TakeLoanScreen now
 * accepts (used when the buy/downsized flow can't afford the transaction
 * and bounces the user here with a specific loan amount in mind).
 */

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
  // Engineer-ish defaults — the screen reads from playerSlice for the
  // impact preview computation.
  store.dispatch(
    setPlayerData({
      cashOnHand: 5000,
      salary: 4900,
      passiveIncome: 0,
      totalIncome: 4900,
      totalExpenses: 2710,
      paydayAmount: 2190,
      cashflow: -2710,
    }) as any,
  )
  return store
}

function renderAt(url: string) {
  const store = buildStore()
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/game/:roomCode/transaction/loan" element={<TakeLoanScreen />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('TakeLoanScreen — ?suggested= deep-link', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('with no ?suggested= param, defaults to 1 × $1,000', () => {
    renderAt('/game/ABCDEF/transaction/loan')
    expect(screen.getByTestId('loan-amount')).toHaveTextContent('$1,000')
  })

  it('?suggested=3000 pre-fills the stepper to $3,000', () => {
    renderAt('/game/ABCDEF/transaction/loan?suggested=3000')
    expect(screen.getByTestId('loan-amount')).toHaveTextContent('$3,000')
  })

  it('?suggested=2500 rounds to the nearest $1,000 increment ($3,000)', () => {
    renderAt('/game/ABCDEF/transaction/loan?suggested=2500')
    expect(screen.getByTestId('loan-amount')).toHaveTextContent('$3,000')
  })

  it('?suggested=999 rounds down to 1 increment but enforces the minimum', () => {
    // 999 / 1000 ≈ 1 (round to nearest), so 1 increment
    renderAt('/game/ABCDEF/transaction/loan?suggested=999')
    expect(screen.getByTestId('loan-amount')).toHaveTextContent('$1,000')
  })

  it('?suggested above MAX ($50,000) clamps at the cap', () => {
    renderAt('/game/ABCDEF/transaction/loan?suggested=999999')
    expect(screen.getByTestId('loan-amount')).toHaveTextContent('$50,000')
  })

  it('non-numeric ?suggested falls back to default ($1,000)', () => {
    renderAt('/game/ABCDEF/transaction/loan?suggested=abc')
    expect(screen.getByTestId('loan-amount')).toHaveTextContent('$1,000')
  })

  it('zero ?suggested falls back to default ($1,000)', () => {
    renderAt('/game/ABCDEF/transaction/loan?suggested=0')
    expect(screen.getByTestId('loan-amount')).toHaveTextContent('$1,000')
  })
})
