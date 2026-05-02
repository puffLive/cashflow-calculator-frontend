import { describe, it, expect } from 'vitest'
import reducer, {
  setAllPlayers,
  addPlayer,
  updatePlayer,
  updatePlayerConnectionStatus,
  removePlayer,
  resetAllPlayers,
  selectPlayerById,
  selectConnectedPlayers,
  selectReadyPlayers,
  type PlayerSummary,
} from '@/store/slices/allPlayersSlice'

const buildPlayer = (over: Partial<PlayerSummary> = {}): PlayerSummary => ({
  id: 'p1',
  name: 'Alice',
  cashOnHand: 5000,
  cashflow: 0,
  paydayAmount: 0,
  passiveIncome: 0,
  totalExpenses: 0,
  assetCount: 0,
  isOnFastTrack: false,
  connectionStatus: 'connected',
  isReady: false,
  isHost: true,
  ...over,
})

describe('allPlayersSlice', () => {
  it('initial state is an empty player list', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ players: [] })
  })

  it('setAllPlayers replaces the whole list', () => {
    const s = reducer(undefined, setAllPlayers([buildPlayer(), buildPlayer({ id: 'p2', name: 'Bob' })]))
    expect(s.players).toHaveLength(2)
  })

  it('addPlayer appends a new player', () => {
    const s = reducer(undefined, addPlayer(buildPlayer()))
    expect(s.players).toHaveLength(1)
    expect(s.players[0].name).toBe('Alice')
  })

  it('addPlayer is idempotent on duplicate id', () => {
    let s = reducer(undefined, addPlayer(buildPlayer()))
    s = reducer(s, addPlayer(buildPlayer({ name: 'Alice — second join' })))
    expect(s.players).toHaveLength(1)
    expect(s.players[0].name).toBe('Alice') // first registration kept
  })

  it('updatePlayer merges fields onto an existing player', () => {
    let s = reducer(undefined, addPlayer(buildPlayer()))
    s = reducer(s, updatePlayer({ id: 'p1', cashOnHand: 9999, cashflow: 100 }))
    expect(s.players[0].cashOnHand).toBe(9999)
    expect(s.players[0].cashflow).toBe(100)
    expect(s.players[0].name).toBe('Alice') // untouched fields kept
  })

  it('updatePlayer is a no-op for unknown id', () => {
    let s = reducer(undefined, addPlayer(buildPlayer()))
    s = reducer(s, updatePlayer({ id: 'ghost', cashOnHand: 1 }))
    expect(s.players).toHaveLength(1)
    expect(s.players[0].cashOnHand).toBe(5000)
  })

  it('updatePlayerConnectionStatus only flips that one field', () => {
    let s = reducer(undefined, addPlayer(buildPlayer()))
    s = reducer(s, updatePlayerConnectionStatus({ playerId: 'p1', status: 'disconnected' }))
    expect(s.players[0].connectionStatus).toBe('disconnected')
    expect(s.players[0].cashOnHand).toBe(5000)
  })

  it('removePlayer drops the player by id', () => {
    let s = reducer(undefined, addPlayer(buildPlayer()))
    s = reducer(s, addPlayer(buildPlayer({ id: 'p2', name: 'Bob' })))
    s = reducer(s, removePlayer('p1'))
    expect(s.players).toHaveLength(1)
    expect(s.players[0].id).toBe('p2')
  })

  it('resetAllPlayers clears the list', () => {
    let s = reducer(undefined, addPlayer(buildPlayer()))
    s = reducer(s, resetAllPlayers())
    expect(s.players).toEqual([])
  })

  describe('selectors', () => {
    const buildState = (players: PlayerSummary[]) => ({ allPlayers: { players } })

    it('selectPlayerById finds the matching player', () => {
      const state = buildState([buildPlayer(), buildPlayer({ id: 'p2', name: 'Bob' })])
      expect(selectPlayerById('p2')(state as any)?.name).toBe('Bob')
      expect(selectPlayerById('ghost')(state as any)).toBeUndefined()
    })

    it('selectConnectedPlayers filters by connection status', () => {
      const state = buildState([
        buildPlayer({ id: 'p1' }),
        buildPlayer({ id: 'p2', connectionStatus: 'disconnected' }),
        buildPlayer({ id: 'p3', connectionStatus: 'removed' }),
      ])
      const connected = selectConnectedPlayers(state as any)
      expect(connected).toHaveLength(1)
      expect(connected[0].id).toBe('p1')
    })

    it('selectReadyPlayers filters by isReady', () => {
      const state = buildState([
        buildPlayer({ id: 'p1', isReady: true }),
        buildPlayer({ id: 'p2', isReady: false }),
      ])
      expect(selectReadyPlayers(state as any).map((p) => p.id)).toEqual(['p1'])
    })
  })
})
