import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { apiSlice } from '@/services/api'
import gameSessionReducer from '@/store/slices/gameSessionSlice'
import playerReducer from '@/store/slices/playerSlice'
import allPlayersReducer from '@/store/slices/allPlayersSlice'
import auditReducer from '@/store/slices/auditSlice'
import transactionReducer from '@/store/slices/transactionSlice'
import uiReducer from '@/store/slices/uiSlice'
import { ProtectedRoute } from '@/components/ProtectedRoute'

/**
 * Tests for the route guards added in 0.4.2 + 0.4.3.
 *
 * Each test mounts a MemoryRouter with FOUR sentinel routes — `/`, `/lobby`,
 * `/setup`, and `/dashboard`. Only the route under test wraps its sentinel
 * with a `ProtectedRoute`; the OTHER routes render bare sentinels. When a
 * redirect fires, the destination's bare sentinel renders, which is the
 * unambiguous signal that the redirect happened.
 */

function buildStore() {
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

function installFetchStub(responder: (url: string) => { status: number; body: any }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : input.toString()
      const { status, body } = responder(url)
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
}

interface RenderOpts {
  /** Where to mount the ProtectedRoute under test. */
  guardedRoute: 'lobby' | 'setup' | 'dashboard'
  /** ProtectedRoute props. */
  guardProps?: React.ComponentProps<typeof ProtectedRoute>
  /** URL to start at. */
  initialPath: string
}

function renderGuarded({ guardedRoute, guardProps, initialPath }: RenderOpts) {
  const store = buildStore()
  const guarded = (
    <ProtectedRoute {...(guardProps as any)}>
      <div data-testid={`${guardedRoute}-protected`}>{guardedRoute.toUpperCase()} (guarded)</div>
    </ProtectedRoute>
  )
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={<div data-testid="landing">LANDING</div>} />
          <Route
            path="/game/:roomCode/lobby"
            element={
              guardedRoute === 'lobby' ? (
                guarded
              ) : (
                <div data-testid="lobby-bare">LOBBY (bare)</div>
              )
            }
          />
          <Route
            path="/game/:roomCode/setup"
            element={
              guardedRoute === 'setup' ? (
                guarded
              ) : (
                <div data-testid="setup-bare">SETUP (bare)</div>
              )
            }
          />
          <Route
            path="/game/:roomCode/dashboard"
            element={
              guardedRoute === 'dashboard' ? (
                guarded
              ) : (
                <div data-testid="dashboard-bare">DASHBOARD (bare)</div>
              )
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ProtectedRoute — route guards (0.4.2 / 0.4.3)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  // ────────────────────────────────────────────────────────────────────
  // 0.4.3 — invalid / malformed room code
  // ────────────────────────────────────────────────────────────────────

  it('malformed room code (less than 6 chars) bounces to landing without hitting the API', async () => {
    const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)

    renderGuarded({
      guardedRoute: 'lobby',
      initialPath: '/game/AB/lobby',
    })

    await waitFor(() => expect(screen.getByTestId('landing')).toBeInTheDocument())
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('malformed room code (non-alphanumeric) bounces to landing', async () => {
    const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)

    renderGuarded({
      guardedRoute: 'lobby',
      initialPath: '/game/AB!CDE/lobby',
    })

    await waitFor(() => expect(screen.getByTestId('landing')).toBeInTheDocument())
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('valid room code that 404s shows the "not found" error UI', async () => {
    installFetchStub(() => ({
      status: 404,
      body: { error: 'Game not found' },
    }))

    renderGuarded({
      guardedRoute: 'lobby',
      initialPath: '/game/ABCDEF/lobby',
    })

    await waitFor(() =>
      expect(screen.getByText(/room code not found/i)).toBeInTheDocument(),
    )
    expect(screen.queryByTestId('lobby-protected')).not.toBeInTheDocument()
  })

  it('valid room code that 410s shows the "expired" error UI', async () => {
    installFetchStub(() => ({
      status: 410,
      body: { error: 'Game expired' },
    }))

    renderGuarded({
      guardedRoute: 'lobby',
      initialPath: '/game/ABCDEF/lobby',
    })

    // Both the H1 and the body paragraph contain the phrase — match the
    // heading specifically.
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /game session has expired/i }),
      ).toBeInTheDocument(),
    )
  })

  // ────────────────────────────────────────────────────────────────────
  // 0.4.2 — phase guards
  // ────────────────────────────────────────────────────────────────────

  it('redirectIfStarted: redirects from lobby to dashboard when game.status === "active"', async () => {
    installFetchStub(() => ({
      status: 200,
      body: { roomCode: 'ABCDEF', status: 'active' },
    }))

    renderGuarded({
      guardedRoute: 'lobby',
      guardProps: { redirectIfStarted: true, children: null as any },
      initialPath: '/game/ABCDEF/lobby',
    })

    // The destination's bare sentinel proves the redirect fired.
    await waitFor(() =>
      expect(screen.getByTestId('dashboard-bare')).toBeInTheDocument(),
    )
    expect(screen.queryByTestId('lobby-protected')).not.toBeInTheDocument()
  })

  it('redirectIfStarted: stays on lobby when game.status === "waiting"', async () => {
    installFetchStub(() => ({
      status: 200,
      body: { roomCode: 'ABCDEF', status: 'waiting' },
    }))

    renderGuarded({
      guardedRoute: 'lobby',
      guardProps: { redirectIfStarted: true, children: null as any },
      initialPath: '/game/ABCDEF/lobby',
    })

    await waitFor(() =>
      expect(screen.getByTestId('lobby-protected')).toBeInTheDocument(),
    )
    expect(screen.queryByTestId('dashboard-bare')).not.toBeInTheDocument()
  })

  it('redirectIfSetupComplete: redirects from setup to dashboard when flag is set + game active', async () => {
    sessionStorage.setItem('playerSetupComplete', 'true')
    installFetchStub(() => ({
      status: 200,
      body: { roomCode: 'ABCDEF', status: 'active' },
    }))

    renderGuarded({
      guardedRoute: 'setup',
      guardProps: { redirectIfSetupComplete: true, children: null as any },
      initialPath: '/game/ABCDEF/setup',
    })

    await waitFor(() =>
      expect(screen.getByTestId('dashboard-bare')).toBeInTheDocument(),
    )
    expect(screen.queryByTestId('setup-protected')).not.toBeInTheDocument()
  })

  it('redirectIfSetupComplete: redirects to lobby (not dashboard) when game still waiting', async () => {
    sessionStorage.setItem('playerSetupComplete', 'true')
    installFetchStub(() => ({
      status: 200,
      body: { roomCode: 'ABCDEF', status: 'waiting' },
    }))

    renderGuarded({
      guardedRoute: 'setup',
      guardProps: { redirectIfSetupComplete: true, children: null as any },
      initialPath: '/game/ABCDEF/setup',
    })

    await waitFor(() =>
      expect(screen.getByTestId('lobby-bare')).toBeInTheDocument(),
    )
  })

  it('redirectIfSetupComplete: stays on setup when the flag is not set', async () => {
    installFetchStub(() => ({
      status: 200,
      body: { roomCode: 'ABCDEF', status: 'waiting' },
    }))

    renderGuarded({
      guardedRoute: 'setup',
      guardProps: { redirectIfSetupComplete: true, children: null as any },
      initialPath: '/game/ABCDEF/setup',
    })

    await waitFor(() =>
      expect(screen.getByTestId('setup-protected')).toBeInTheDocument(),
    )
  })

  it('requireSetup: redirects to lobby when game still waiting', async () => {
    installFetchStub(() => ({
      status: 200,
      body: { roomCode: 'ABCDEF', status: 'waiting' },
    }))

    renderGuarded({
      guardedRoute: 'dashboard',
      guardProps: { requireSetup: true, children: null as any },
      initialPath: '/game/ABCDEF/dashboard',
    })

    await waitFor(() =>
      expect(screen.getByTestId('lobby-bare')).toBeInTheDocument(),
    )
  })

  it('requireSetup: shows expired UI when game.status === "expired"', async () => {
    installFetchStub(() => ({
      status: 200,
      body: { roomCode: 'ABCDEF', status: 'expired' },
    }))

    renderGuarded({
      guardedRoute: 'dashboard',
      guardProps: { requireSetup: true, children: null as any },
      initialPath: '/game/ABCDEF/dashboard',
    })

    await waitFor(() =>
      expect(screen.getByText(/session expired/i)).toBeInTheDocument(),
    )
  })
})
