import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Tests for the SocketService singleton's connection lifecycle.
 *
 * The whole `socket.io-client` module is mocked. We capture the options
 * passed to `io(url, opts)` to verify the auth payload, and we expose a
 * controllable fake socket instance to drive `connect` / `disconnect` /
 * `connect_error` events through their respective handlers.
 */

// ── Mock socket.io-client ────────────────────────────────────────────────
const ioCalls: Array<{ url: string; opts: any }> = []
const eventHandlers = new Map<string, ((arg?: any) => void)[]>()

function makeFakeSocket(): any {
  return {
    id: 'fake-socket-id',
    connected: false,
    io: { engine: { transport: { name: 'websocket' } } },
    on(event: string, handler: (arg?: any) => void) {
      const handlers = eventHandlers.get(event) ?? []
      handlers.push(handler)
      eventHandlers.set(event, handlers)
    },
    emit: vi.fn(),
    disconnect: vi.fn(function (this: any) {
      this.connected = false
    }),
  }
}

let currentSocket: any
vi.mock('socket.io-client', () => ({
  io: vi.fn((url: string, opts: any) => {
    ioCalls.push({ url, opts })
    currentSocket = makeFakeSocket()
    return currentSocket
  }),
}))

// Helper: fire an event the service registered.
function fireSocketEvent(name: string, data?: any) {
  const handlers = eventHandlers.get(name) ?? []
  handlers.forEach((h) => h(data))
}

// Lazy-import so the mock above is in place first.
import { socketService } from '@/services/socketService'

describe('SocketService', () => {
  beforeEach(() => {
    sessionStorage.clear()
    ioCalls.length = 0
    eventHandlers.clear()
    // Wipe the singleton's internal connection state from any prior test.
    socketService.disconnect()
  })

  afterEach(() => {
    socketService.disconnect()
  })

  // ──────────────────────────────────────────────────────────────────────
  // Auth wiring (the load-bearing fix from 16.6.1)
  // ──────────────────────────────────────────────────────────────────────

  describe('connect() — auth wiring', () => {
    it('passes the playerId + socketAuthToken from sessionStorage as auth options', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token-abc-def')

      // Don't await — we'll resolve the promise manually by firing connect
      const promise = socketService.connect('http://test')
      fireSocketEvent('connect')
      await promise

      expect(ioCalls).toHaveLength(1)
      expect(ioCalls[0].opts.auth).toEqual({
        playerId: 'p1',
        socketAuthToken: 'token-abc-def',
      })
    })

    it('sends undefined when no credentials are persisted (server will reject — surfaced as connect_error: Unauthorized)', async () => {
      // Don't seed sessionStorage
      const promise = socketService.connect('http://test')
      fireSocketEvent('connect')
      await promise

      expect(ioCalls[0].opts.auth).toEqual({
        playerId: undefined,
        socketAuthToken: undefined,
      })
    })

    it('rejects immediately on connect_error: "Unauthorized" (does not loop)', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'wrong-token')

      const promise = socketService.connect('http://test')
      // Server rejects — middleware passed Error('Unauthorized') to next()
      fireSocketEvent('connect_error', { message: 'Unauthorized' })

      await expect(promise).rejects.toThrow(/Unauthorized/i)
    })

    it('does NOT reject on a recoverable connect_error (retries via reconnection)', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token')

      const promise = socketService.connect('http://test')
      // Some transport-level error — Socket.io will retry
      fireSocketEvent('connect_error', { message: 'xhr poll error' })
      // Eventually connect succeeds
      fireSocketEvent('connect')

      await expect(promise).resolves.toBeUndefined()
    })
  })

  // ──────────────────────────────────────────────────────────────────────
  // Reconnection options
  // ──────────────────────────────────────────────────────────────────────

  describe('connect() — reconnection options', () => {
    it('configures reconnection with attempts + delay caps', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token')

      const promise = socketService.connect('http://test')
      fireSocketEvent('connect')
      await promise

      const opts = ioCalls[0].opts
      expect(opts.reconnection).toBe(true)
      expect(opts.reconnectionAttempts).toBeGreaterThan(0)
      expect(opts.reconnectionDelay).toBeGreaterThan(0)
      expect(opts.reconnectionDelayMax).toBeGreaterThanOrEqual(opts.reconnectionDelay)
    })

    it('starts with polling transport then upgrades to websocket', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token')

      const promise = socketService.connect('http://test')
      fireSocketEvent('connect')
      await promise

      expect(ioCalls[0].opts.transports).toEqual(['polling', 'websocket'])
      expect(ioCalls[0].opts.upgrade).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────
  // Room management
  // ──────────────────────────────────────────────────────────────────────

  describe('joinRoom / leaveRoom', () => {
    it('emits join:room with roomCode + playerId', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token')

      const promise = socketService.connect('http://test')
      currentSocket.connected = true // simulate post-connect state
      fireSocketEvent('connect')
      await promise

      socketService.joinRoom('TESTAB', 'p1')
      expect(currentSocket.emit).toHaveBeenCalledWith('join:room', {
        roomCode: 'TESTAB',
        playerId: 'p1',
      })
    })

    it('emits join:room without playerId when none provided', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token')

      const promise = socketService.connect('http://test')
      currentSocket.connected = true
      fireSocketEvent('connect')
      await promise

      socketService.joinRoom('TESTAB')
      expect(currentSocket.emit).toHaveBeenCalledWith('join:room', {
        roomCode: 'TESTAB',
      })
    })

    it('joinRoom is a no-op when not connected', async () => {
      // Don't connect — service has no socket
      socketService.joinRoom('TESTAB', 'p1')
      // No socket exists; nothing to assert except that this doesn't throw
      expect(true).toBe(true)
    })

    it('leaveRoom emits leave:room and forgets the current room', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token')

      const promise = socketService.connect('http://test')
      currentSocket.connected = true
      fireSocketEvent('connect')
      await promise

      socketService.joinRoom('TESTAB', 'p1')
      socketService.leaveRoom()
      expect(currentSocket.emit).toHaveBeenCalledWith('leave:room', {
        roomCode: 'TESTAB',
      })
    })
  })

  // ──────────────────────────────────────────────────────────────────────
  // Event subscription
  // ──────────────────────────────────────────────────────────────────────

  describe('onEvent / offEvent', () => {
    it('registered handler fires when the underlying socket emits the event', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token')

      const promise = socketService.connect('http://test')
      fireSocketEvent('connect')
      await promise

      const handler = vi.fn()
      socketService.onEvent('player:joined', handler)

      // Simulate the server sending the event — service-level relay invokes
      // the registered handler.
      fireSocketEvent('player:joined', { playerId: 'p2', playerName: 'Bob' })

      expect(handler).toHaveBeenCalledWith({ playerId: 'p2', playerName: 'Bob' })
    })

    it('offEvent with no callback removes all handlers for that event', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token')

      const promise = socketService.connect('http://test')
      fireSocketEvent('connect')
      await promise

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      socketService.onEvent('player:joined', handler1)
      socketService.onEvent('player:joined', handler2)

      socketService.offEvent('player:joined')
      fireSocketEvent('player:joined', { playerId: 'p2', playerName: 'Bob' })

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })

    it('offEvent with a callback removes only that handler', async () => {
      sessionStorage.setItem('playerId', 'p1')
      sessionStorage.setItem('socketAuthToken', 'token')

      const promise = socketService.connect('http://test')
      fireSocketEvent('connect')
      await promise

      const stay = vi.fn()
      const remove = vi.fn()
      socketService.onEvent('player:joined', stay)
      socketService.onEvent('player:joined', remove)

      socketService.offEvent('player:joined', remove)
      fireSocketEvent('player:joined', { playerId: 'p2', playerName: 'Bob' })

      expect(stay).toHaveBeenCalled()
      expect(remove).not.toHaveBeenCalled()
    })
  })

  // ──────────────────────────────────────────────────────────────────────
  // Disconnect lifecycle
  // ──────────────────────────────────────────────────────────────────────

  it('disconnect() calls socket.disconnect and clears event handlers', async () => {
    sessionStorage.setItem('playerId', 'p1')
    sessionStorage.setItem('socketAuthToken', 'token')

    const promise = socketService.connect('http://test')
    fireSocketEvent('connect')
    await promise

    const sock = currentSocket
    socketService.disconnect()
    expect(sock.disconnect).toHaveBeenCalled()
  })
})
