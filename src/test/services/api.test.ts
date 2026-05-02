import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '@/services/api'
import { gameApi } from '@/services/gameApi'
import { transactionApi } from '@/services/transactionApi'
import gameSessionReducer from '@/store/slices/gameSessionSlice'
import playerReducer from '@/store/slices/playerSlice'
import allPlayersReducer from '@/store/slices/allPlayersSlice'
import auditReducer from '@/store/slices/auditSlice'
import transactionReducer from '@/store/slices/transactionSlice'
import uiReducer from '@/store/slices/uiSlice'

/**
 * Endpoint-shape tests for the RTK Query mutations + queries. Stubs global
 * `fetch` so we can capture the request URL / method / body / headers
 * exactly as the apiSlice would send them — no live backend required.
 *
 * Also covers the apiSlice's 410 baseQuery wrapper (16.6.4): a 410 response
 * triggers `clearSessionCredentials()` + `openModal('session_expired')`.
 */

interface Capture {
  url: string
  method: string
  body: any
  headers: Record<string, string>
}

const captures: Capture[] = []

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

/**
 * Install a fetch stub that captures every request and returns whatever
 * `responder` returns for that call.
 */
function installFetchStub(
  responder: (req: Capture) => { status: number; body: any } = () => ({
    status: 200,
    body: {},
  }),
) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      // RTK Query's fetchBaseQuery typically passes a Request object as the
      // sole argument — pull url / method / body / headers off it.
      let url: string
      let method: string
      let body: any
      const headers: Record<string, string> = {}

      if (input instanceof Request) {
        url = input.url
        method = input.method
        const text = await input.clone().text()
        body = text ? safeParseJson(text) : undefined
        input.headers.forEach((v, k) => (headers[k] = v))
      } else {
        url = typeof input === 'string' ? input : input.toString()
        method = init?.method ?? 'GET'
        const rawHeaders = init?.headers
        if (rawHeaders instanceof Headers) {
          rawHeaders.forEach((v, k) => (headers[k] = v))
        } else if (rawHeaders && typeof rawHeaders === 'object') {
          Object.assign(headers, rawHeaders as Record<string, string>)
        }
        body =
          typeof init?.body === 'string' ? safeParseJson(init.body) : init?.body
      }

      const cap: Capture = { url, method, body, headers }
      captures.push(cap)
      const { status, body: respBody } = responder(cap)
      return new Response(JSON.stringify(respBody), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
}

function safeParseJson(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}

describe('apiSlice + endpoints — request shapes', () => {
  let store: ReturnType<typeof buildStore>

  beforeEach(() => {
    captures.length = 0
    sessionStorage.clear()
    store = buildStore()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ────────────────────────────────────────────────────────────────────
  // gameApi
  // ────────────────────────────────────────────────────────────────────

  describe('gameApi', () => {
    it('createGame: POST /games with gameVersion + hostName', async () => {
      installFetchStub(() => ({
        status: 201,
        body: {
          roomCode: 'ABCDEF',
          hostPlayerId: 'p1',
          gameSessionId: 'g1',
          socketAuthToken: 'token-abc',
        },
      }))

      const result = await store.dispatch(
        gameApi.endpoints.createGame.initiate({
          gameVersion: 'cashflow_101',
          hostName: 'Alice',
        }),
      )

      expect(result.data).toMatchObject({
        roomCode: 'ABCDEF',
        socketAuthToken: 'token-abc',
      })
      expect(captures[0].method).toBe('POST')
      expect(captures[0].url).toMatch(/\/games$/)
      expect(captures[0].body).toEqual({
        gameVersion: 'cashflow_101',
        hostName: 'Alice',
      })
    })

    it('joinGame: POST /games/:roomCode/join with playerName', async () => {
      installFetchStub(() => ({
        status: 200,
        body: {
          playerId: 'p2',
          gameSessionId: 'g1',
          roomCode: 'ABCDEF',
          playerNumber: 2,
          avatarColor: '#00FF00',
          socketAuthToken: 'token-def',
        },
      }))

      await store.dispatch(
        gameApi.endpoints.joinGame.initiate({
          roomCode: 'ABCDEF',
          playerName: 'Bob',
        }),
      )

      expect(captures[0].method).toBe('POST')
      expect(captures[0].url).toMatch(/\/games\/ABCDEF\/join$/)
      expect(captures[0].body).toEqual({ playerName: 'Bob' })
    })

    it('startGame: PATCH /games/:roomCode/start with playerId', async () => {
      installFetchStub(() => ({ status: 200, body: {} }))

      await store.dispatch(
        gameApi.endpoints.startGame.initiate({
          roomCode: 'ABCDEF',
          playerId: 'p1',
        }),
      )

      expect(captures[0].method).toBe('PATCH')
      expect(captures[0].url).toMatch(/\/games\/ABCDEF\/start$/)
      expect(captures[0].body).toEqual({ playerId: 'p1' })
    })

    it('reconnectPlayer: POST /reconnect with required socketId body', async () => {
      installFetchStub(() => ({
        status: 200,
        body: {
          message: 'Reconnected successfully',
          socketAuthToken: 'rotated-token',
          player: { _id: 'p1' },
          gameState: {},
        },
      }))

      await store.dispatch(
        gameApi.endpoints.reconnectPlayer.initiate({
          roomCode: 'ABCDEF',
          playerId: 'p1',
          socketId: 'fresh-socket',
        }),
      )

      expect(captures[0].method).toBe('POST')
      expect(captures[0].url).toMatch(/\/players\/p1\/reconnect$/)
      // socketId MUST be in body — backend route validator requires it.
      expect(captures[0].body).toEqual({ socketId: 'fresh-socket' })
    })

    it('reassignAuditor: PATCH /players/:id/auditor with newAuditorPlayerId', async () => {
      installFetchStub(() => ({ status: 200, body: {} }))

      await store.dispatch(
        gameApi.endpoints.reassignAuditor.initiate({
          roomCode: 'ABCDEF',
          playerId: 'p1',
          newAuditorPlayerId: 'p3',
        }),
      )

      expect(captures[0].method).toBe('PATCH')
      expect(captures[0].url).toMatch(/\/players\/p1\/auditor$/)
      expect(captures[0].body).toEqual({ newAuditorPlayerId: 'p3' })
    })

    it('submitMarketEvent: POST /market-event with type + subType + amount', async () => {
      installFetchStub(() => ({
        status: 201,
        body: { message: 'ok', transactionId: 't1', status: 'pending', impact: {} },
      }))

      await store.dispatch(
        gameApi.endpoints.submitMarketEvent.initiate({
          roomCode: 'ABCDEF',
          playerId: 'p1',
          subType: 'doodad',
          amount: 200,
        }),
      )

      expect(captures[0].method).toBe('POST')
      expect(captures[0].url).toMatch(/\/players\/p1\/market-event$/)
      expect(captures[0].body).toMatchObject({
        type: 'market_event',
        subType: 'doodad',
        amount: 200,
      })
    })
  })

  // ────────────────────────────────────────────────────────────────────
  // transactionApi
  // ────────────────────────────────────────────────────────────────────

  describe('transactionApi', () => {
    it('submitTransaction: POST /players/:id/transactions with type + details', async () => {
      installFetchStub(() => ({
        status: 201,
        body: { transaction: { id: 't1' } },
      }))

      await store.dispatch(
        transactionApi.endpoints.submitTransaction.initiate({
          roomCode: 'ABCDEF',
          playerId: 'p1',
          type: 'buy',
          subType: 'stock',
          details: { stockName: 'TEST', pricePerShare: 10, numShares: 100 },
        }),
      )

      expect(captures[0].method).toBe('POST')
      expect(captures[0].url).toMatch(/\/players\/p1\/transactions$/)
      expect(captures[0].body).toMatchObject({
        type: 'buy',
        subType: 'stock',
      })
    })

    it('auditTransaction: PATCH ?auditorId=… with action + note', async () => {
      installFetchStub(() => ({
        status: 200,
        body: { transaction: { id: 't1' } },
      }))

      await store.dispatch(
        transactionApi.endpoints.auditTransaction.initiate({
          roomCode: 'ABCDEF',
          transactionId: 't1',
          auditorId: 'p2',
          action: 'reject',
          note: 'looks wrong',
        }),
      )

      expect(captures[0].method).toBe('PATCH')
      expect(captures[0].url).toMatch(
        /\/transactions\/t1\/audit\?auditorId=p2$/,
      )
      expect(captures[0].body).toEqual({ action: 'reject', note: 'looks wrong' })
    })

    it('auditTransaction omits the note field when none is provided', async () => {
      installFetchStub(() => ({ status: 200, body: { transaction: { id: 't1' } } }))

      await store.dispatch(
        transactionApi.endpoints.auditTransaction.initiate({
          roomCode: 'ABCDEF',
          transactionId: 't1',
          auditorId: 'p2',
          action: 'approve',
        }),
      )

      expect(captures[0].body).toEqual({ action: 'approve' })
    })

    it('renotifyTransaction: POST /transactions/:id/renotify?playerId=…', async () => {
      installFetchStub(() => ({
        status: 200,
        body: {
          message: 'Auditor re-notified',
          transactionId: 't1',
          auditorPlayerId: 'p2',
          auditorReachable: true,
        },
      }))

      const result = await store.dispatch(
        transactionApi.endpoints.renotifyTransaction.initiate({
          roomCode: 'ABCDEF',
          transactionId: 't1',
          playerId: 'p1',
        }),
      )

      expect(captures[0].method).toBe('POST')
      expect(captures[0].url).toMatch(/\/transactions\/t1\/renotify\?playerId=p1$/)
      expect(result.data?.auditorReachable).toBe(true)
    })

    it('undoTransaction: POST /players/:id/undo (no body)', async () => {
      installFetchStub(() => ({ status: 201, body: { transaction: { id: 'u1' } } }))

      await store.dispatch(
        transactionApi.endpoints.undoTransaction.initiate({
          roomCode: 'ABCDEF',
          playerId: 'p1',
        }),
      )

      expect(captures[0].method).toBe('POST')
      expect(captures[0].url).toMatch(/\/players\/p1\/undo$/)
    })

    it('getTransactions: passes filters as URL query params', async () => {
      installFetchStub(() => ({
        status: 200,
        body: { transactions: [] },
      }))

      await store.dispatch(
        transactionApi.endpoints.getTransactions.initiate({
          roomCode: 'ABCDEF',
          playerId: 'p1',
          type: 'buy',
          limit: 10,
          offset: 0,
        }),
      )

      expect(captures[0].method).toBe('GET')
      expect(captures[0].url).toContain('/games/ABCDEF/transactions')
      expect(captures[0].url).toContain('playerId=p1')
      expect(captures[0].url).toContain('type=buy')
      expect(captures[0].url).toContain('limit=10')
    })

    it('getTransactions transformResponse unwraps the {transactions: [...]} envelope', async () => {
      installFetchStub(() => ({
        status: 200,
        body: { transactions: [{ id: 't1' }, { id: 't2' }] },
      }))

      const result = await store.dispatch(
        transactionApi.endpoints.getTransactions.initiate({ roomCode: 'ABCDEF' }),
      )

      expect(result.data).toEqual([{ id: 't1' }, { id: 't2' }])
    })
  })

  // ────────────────────────────────────────────────────────────────────
  // 410 baseQuery wrapper (16.6.4)
  // ────────────────────────────────────────────────────────────────────

  describe('apiSlice baseQuery 410 handler', () => {
    it('clears session creds + opens session_expired modal on any 410 response', async () => {
      // Pre-load creds so we can verify they get wiped
      sessionStorage.setItem('roomCode', 'ABCDEF')
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('playerName', 'Alice')
      sessionStorage.setItem('socketAuthToken', 'token-abc')

      installFetchStub(() => ({
        status: 410,
        body: { error: 'Game expired', message: 'expired' },
      }))

      // Any write call works — using createGame for simplicity
      await store.dispatch(
        gameApi.endpoints.createGame.initiate({
          gameVersion: 'cashflow_101',
          hostName: 'Alice',
        }),
      )

      expect(sessionStorage.getItem('roomCode')).toBeNull()
      expect(sessionStorage.getItem('playerId')).toBeNull()
      expect(sessionStorage.getItem('playerName')).toBeNull()
      expect(sessionStorage.getItem('socketAuthToken')).toBeNull()
      expect(store.getState().ui.modalOpen).toBe('session_expired')
    })

    it('does not fire the modal for non-410 errors (e.g. 400)', async () => {
      installFetchStub(() => ({
        status: 400,
        body: { error: 'Bad request' },
      }))

      await store.dispatch(
        gameApi.endpoints.createGame.initiate({
          gameVersion: 'cashflow_101',
          hostName: '',
        }),
      )

      expect(store.getState().ui.modalOpen).toBeNull()
    })
  })
})
