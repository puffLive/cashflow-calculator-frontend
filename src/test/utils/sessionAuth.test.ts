import { describe, it, expect, beforeEach } from 'vitest'
import {
  setSessionCredentials,
  setSocketAuthToken,
  getSocketAuth,
  clearSessionCredentials,
} from '@/utils/sessionAuth'

/**
 * The session-auth helper is load-bearing for the Socket.io connection
 * (every connect reads the token out of sessionStorage). Tests pin the
 * basic round-trip and the "rotate token without losing other creds"
 * behavior that ReconnectionHandler depends on.
 */
describe('sessionAuth helpers', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('setSessionCredentials persists all four fields', () => {
    setSessionCredentials({
      roomCode: 'ABCDEF',
      playerId: 'p1',
      playerName: 'Alice',
      socketAuthToken: 'token-abc',
    })

    expect(sessionStorage.getItem('roomCode')).toBe('ABCDEF')
    expect(sessionStorage.getItem('playerId')).toBe('p1')
    expect(sessionStorage.getItem('playerName')).toBe('Alice')
    expect(sessionStorage.getItem('socketAuthToken')).toBe('token-abc')
  })

  it('getSocketAuth reads playerId + socketAuthToken (the two fields the io.use middleware checks)', () => {
    setSessionCredentials({
      roomCode: 'ABCDEF',
      playerId: 'p1',
      playerName: 'Alice',
      socketAuthToken: 'token-abc',
    })
    expect(getSocketAuth()).toEqual({
      playerId: 'p1',
      socketAuthToken: 'token-abc',
    })
  })

  it('getSocketAuth returns nulls when no creds are persisted', () => {
    expect(getSocketAuth()).toEqual({
      playerId: null,
      socketAuthToken: null,
    })
  })

  it('setSocketAuthToken rotates only the token; other fields stay', () => {
    setSessionCredentials({
      roomCode: 'ABCDEF',
      playerId: 'p1',
      playerName: 'Alice',
      socketAuthToken: 'old-token',
    })
    setSocketAuthToken('new-token')

    expect(sessionStorage.getItem('socketAuthToken')).toBe('new-token')
    expect(sessionStorage.getItem('roomCode')).toBe('ABCDEF')
    expect(sessionStorage.getItem('playerId')).toBe('p1')
    expect(sessionStorage.getItem('playerName')).toBe('Alice')
  })

  it('clearSessionCredentials wipes all four fields', () => {
    setSessionCredentials({
      roomCode: 'ABCDEF',
      playerId: 'p1',
      playerName: 'Alice',
      socketAuthToken: 'token-abc',
    })
    clearSessionCredentials()

    expect(sessionStorage.getItem('roomCode')).toBeNull()
    expect(sessionStorage.getItem('playerId')).toBeNull()
    expect(sessionStorage.getItem('playerName')).toBeNull()
    expect(sessionStorage.getItem('socketAuthToken')).toBeNull()
  })

  it('clearSessionCredentials does not touch unrelated keys', () => {
    sessionStorage.setItem('unrelated', 'keep me')
    setSessionCredentials({
      roomCode: 'ABCDEF',
      playerId: 'p1',
      playerName: 'Alice',
      socketAuthToken: 'token-abc',
    })
    clearSessionCredentials()
    expect(sessionStorage.getItem('unrelated')).toBe('keep me')
  })
})
