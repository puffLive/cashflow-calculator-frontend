import { createSlice, createSelector } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number // milliseconds, default 5000
  actionLabel?: string // Optional button label (e.g., "Review")
  actionPath?: string // Optional navigation path (e.g., "/game/ABC123/audits")
}

interface UIState {
  activeTab: string
  expiryWarningVisible: boolean
  expiryMinutesRemaining: number
  notifications: Notification[]
  isReconnecting: boolean
  isLoading: boolean
  modalOpen: string | null // ID of currently open modal
}

const initialState: UIState = {
  activeTab: 'dashboard',
  expiryWarningVisible: false,
  expiryMinutesRemaining: 0,
  notifications: [],
  isReconnecting: false,
  isLoading: false,
  modalOpen: null,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload
    },
    showExpiryWarning: (state, action: PayloadAction<number>) => {
      state.expiryWarningVisible = true
      state.expiryMinutesRemaining = action.payload
    },
    hideExpiryWarning: (state) => {
      state.expiryWarningVisible = false
      state.expiryMinutesRemaining = 0
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setReconnecting: (state, action: PayloadAction<boolean>) => {
      state.isReconnecting = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modalOpen = action.payload
    },
    closeModal: (state) => {
      state.modalOpen = null
    },
    resetUI: () => initialState,
  },
})

export const {
  setActiveTab,
  showExpiryWarning,
  hideExpiryWarning,
  addNotification,
  removeNotification,
  clearNotifications,
  setReconnecting,
  setLoading,
  openModal,
  closeModal,
  resetUI,
} = uiSlice.actions

// Selectors
export const selectActiveTab = (state: RootState) => state.ui.activeTab
export const selectExpiryWarningVisible = (state: RootState) => state.ui.expiryWarningVisible
export const selectExpiryMinutesRemaining = (state: RootState) => state.ui.expiryMinutesRemaining

// Memoized selector to prevent unnecessary rerenders
export const selectExpiryWarning = createSelector(
  [selectExpiryWarningVisible, selectExpiryMinutesRemaining],
  (visible, minutesRemaining) => ({
    visible,
    minutesRemaining,
  })
)

export const selectNotifications = (state: RootState) => state.ui.notifications
export const selectIsReconnecting = (state: RootState) => state.ui.isReconnecting
export const selectIsLoading = (state: RootState) => state.ui.isLoading
export const selectModalOpen = (state: RootState) => state.ui.modalOpen

export default uiSlice.reducer