import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

interface GameSessionState {
  roomCode: string | null
  status: 'waiting' | 'active' | 'completed' | 'expired' | null
  hostPlayerId: string | null
  playerCount: number
  maxPlayers: number
  currentPlayerId: string | null // The current user's player ID
  gameVersion: string
}

const initialState: GameSessionState = {
  roomCode: null,
  status: null,
  hostPlayerId: null,
  playerCount: 0,
  maxPlayers: 6,
  currentPlayerId: null,
  gameVersion: 'cashflow101',
}

export const gameSessionSlice = createSlice({
  name: 'gameSession',
  initialState,
  reducers: {
    setGameSession: (state, action: PayloadAction<Partial<GameSessionState>>) => {
      return { ...state, ...action.payload }
    },
    setRoomCode: (state, action: PayloadAction<string>) => {
      state.roomCode = action.payload
    },
    setCurrentPlayerId: (state, action: PayloadAction<string>) => {
      state.currentPlayerId = action.payload
    },
    setGameStatus: (state, action: PayloadAction<GameSessionState['status']>) => {
      state.status = action.payload
    },
    incrementPlayerCount: (state) => {
      state.playerCount += 1
    },
    decrementPlayerCount: (state) => {
      state.playerCount = Math.max(0, state.playerCount - 1)
    },
    resetGameSession: () => initialState,
  },
})

export const {
  setGameSession,
  setRoomCode,
  setCurrentPlayerId,
  setGameStatus,
  incrementPlayerCount,
  decrementPlayerCount,
  resetGameSession,
} = gameSessionSlice.actions

// Selectors
export const selectGameSession = (state: RootState) => state.gameSession
export const selectRoomCode = (state: RootState) => state.gameSession.roomCode
export const selectCurrentPlayerId = (state: RootState) => state.gameSession.currentPlayerId
export const selectIsHost = (state: RootState) =>
  state.gameSession.currentPlayerId === state.gameSession.hostPlayerId
export const selectGameStatus = (state: RootState) => state.gameSession.status

export default gameSessionSlice.reducer
