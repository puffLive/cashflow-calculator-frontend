import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export interface PlayerSummary {
  id: string
  name: string
  profession?: string
  cashOnHand: number
  cashflow: number
  paydayAmount: number
  passiveIncome: number
  totalExpenses: number
  assetCount: number
  isOnFastTrack: boolean
  connectionStatus: 'connected' | 'disconnected' | 'removed'
  isReady: boolean
  isHost: boolean
}

interface AllPlayersState {
  players: PlayerSummary[]
}

const initialState: AllPlayersState = {
  players: [],
}

export const allPlayersSlice = createSlice({
  name: 'allPlayers',
  initialState,
  reducers: {
    setAllPlayers: (state, action: PayloadAction<PlayerSummary[]>) => {
      state.players = action.payload
    },
    addPlayer: (state, action: PayloadAction<PlayerSummary>) => {
      const exists = state.players.find((p) => p.id === action.payload.id)
      if (!exists) {
        state.players.push(action.payload)
      }
    },
    updatePlayer: (state, action: PayloadAction<Partial<PlayerSummary> & { id: string }>) => {
      const index = state.players.findIndex((p) => p.id === action.payload.id)
      if (index !== -1) {
        state.players[index] = { ...state.players[index], ...action.payload }
      }
    },
    updatePlayerConnectionStatus: (
      state,
      action: PayloadAction<{ playerId: string; status: PlayerSummary['connectionStatus'] }>
    ) => {
      const player = state.players.find((p) => p.id === action.payload.playerId)
      if (player) {
        player.connectionStatus = action.payload.status
      }
    },
    removePlayer: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter((p) => p.id !== action.payload)
    },
    resetAllPlayers: () => initialState,
  },
})

export const {
  setAllPlayers,
  addPlayer,
  updatePlayer,
  updatePlayerConnectionStatus,
  removePlayer,
  resetAllPlayers,
} = allPlayersSlice.actions

// Selectors
export const selectAllPlayers = (state: RootState) => state.allPlayers.players
export const selectPlayerById = (playerId: string) => (state: RootState) =>
  state.allPlayers.players.find((p) => p.id === playerId)
export const selectConnectedPlayers = (state: RootState) =>
  state.allPlayers.players.filter((p) => p.connectionStatus === 'connected')
export const selectReadyPlayers = (state: RootState) =>
  state.allPlayers.players.filter((p) => p.isReady)

export default allPlayersSlice.reducer
