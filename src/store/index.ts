import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '@/services/api'
import gameSessionReducer from './slices/gameSessionSlice'
import playerReducer from './slices/playerSlice'
import allPlayersReducer from './slices/allPlayersSlice'
import auditReducer from './slices/auditSlice'
import transactionReducer from './slices/transactionSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    // Add the RTK Query reducer
    [apiSlice.reducerPath]: apiSlice.reducer,
    // Add slice reducers
    gameSession: gameSessionReducer,
    player: playerReducer,
    allPlayers: allPlayersReducer,
    audit: auditReducer,
    transaction: transactionReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch