import { describe, it, expect } from 'vitest'
import reducer, {
  setGameSession,
  setRoomCode,
  setCurrentPlayerId,
  setGameStatus,
  incrementPlayerCount,
  decrementPlayerCount,
  resetGameSession,
  selectIsHost,
  selectGameStatus,
} from '@/store/slices/gameSessionSlice'

describe('gameSessionSlice', () => {
  it('starts with sensible defaults', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state).toMatchObject({
      roomCode: null,
      status: null,
      hostPlayerId: null,
      playerCount: 0,
      maxPlayers: 6,
      currentPlayerId: null,
      gameVersion: 'cashflow101',
    })
  })

  it('setGameSession merges arbitrary fields', () => {
    const state = reducer(
      undefined,
      setGameSession({
        roomCode: 'ABCDEF',
        hostPlayerId: 'host-1',
        currentPlayerId: 'host-1',
        playerCount: 1,
      }),
    )
    expect(state.roomCode).toBe('ABCDEF')
    expect(state.hostPlayerId).toBe('host-1')
    expect(state.maxPlayers).toBe(6) // untouched fields kept
  })

  it('setRoomCode + setCurrentPlayerId + setGameStatus update single fields', () => {
    let s = reducer(undefined, setRoomCode('ZZZZZZ'))
    expect(s.roomCode).toBe('ZZZZZZ')

    s = reducer(s, setCurrentPlayerId('me'))
    expect(s.currentPlayerId).toBe('me')

    s = reducer(s, setGameStatus('active'))
    expect(s.status).toBe('active')
  })

  it('incrementPlayerCount caps nothing; decrementPlayerCount floors at zero', () => {
    let s = reducer(undefined, incrementPlayerCount())
    s = reducer(s, incrementPlayerCount())
    s = reducer(s, incrementPlayerCount())
    expect(s.playerCount).toBe(3)

    s = reducer(s, decrementPlayerCount())
    expect(s.playerCount).toBe(2)

    // Floor at zero
    s = reducer({ ...s, playerCount: 0 }, decrementPlayerCount())
    expect(s.playerCount).toBe(0)
  })

  it('resetGameSession returns to initial state', () => {
    const dirty = reducer(
      undefined,
      setGameSession({ roomCode: 'DIRTY1', currentPlayerId: 'x', playerCount: 5 }),
    )
    expect(dirty.roomCode).toBe('DIRTY1')

    const clean = reducer(dirty, resetGameSession())
    expect(clean.roomCode).toBeNull()
    expect(clean.playerCount).toBe(0)
  })

  describe('selectors', () => {
    const buildState = (over: Partial<any> = {}) => ({
      gameSession: {
        roomCode: 'ABCDEF',
        status: 'active' as const,
        hostPlayerId: 'host-1',
        playerCount: 2,
        maxPlayers: 6,
        currentPlayerId: 'host-1',
        gameVersion: 'cashflow101',
        ...over,
      },
    })

    it('selectIsHost returns true when current player is the host', () => {
      expect(selectIsHost(buildState() as any)).toBe(true)
    })

    it('selectIsHost returns false when current player is not the host', () => {
      expect(
        selectIsHost(
          buildState({ currentPlayerId: 'guest-1', hostPlayerId: 'host-1' }) as any,
        ),
      ).toBe(false)
    })

    it('selectGameStatus reads the status field', () => {
      expect(selectGameStatus(buildState({ status: 'expired' }) as any)).toBe('expired')
    })
  })
})
