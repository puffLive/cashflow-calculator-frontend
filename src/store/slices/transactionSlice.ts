import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { Transaction } from '@/services/transactionApi'

interface TransactionState {
  pendingTransaction: Transaction | null
  transactionHistory: Transaction[]
  isSubmitting: boolean
  lastError: string | null
  pendingSubmittedAt: number | null // Timestamp when transaction was submitted
  canRenotify: boolean // Can user re-notify auditor
}

const initialState: TransactionState = {
  pendingTransaction: null,
  transactionHistory: [],
  isSubmitting: false,
  lastError: null,
  pendingSubmittedAt: null,
  canRenotify: false,
}

export const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setPendingTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.pendingTransaction = action.payload
      state.pendingSubmittedAt = action.payload ? Date.now() : null
      state.canRenotify = false
    },
    enableRenotify: (state) => {
      state.canRenotify = true
    },
    setTransactionHistory: (state, action: PayloadAction<Transaction[]>) => {
      state.transactionHistory = action.payload
    },
    addToHistory: (state, action: PayloadAction<Transaction>) => {
      state.transactionHistory.unshift(action.payload) // Add to beginning
      if (state.transactionHistory.length > 50) {
        state.transactionHistory = state.transactionHistory.slice(0, 50) // Keep last 50
      }
    },
    updateTransaction: (state, action: PayloadAction<Partial<Transaction> & { id: string }>) => {
      const { id, ...updates } = action.payload

      // Update in pending if it matches
      if (state.pendingTransaction?.id === id) {
        state.pendingTransaction = { ...state.pendingTransaction, ...updates }
      }

      // Update in history
      const historyIndex = state.transactionHistory.findIndex((t) => t.id === id)
      if (historyIndex !== -1) {
        state.transactionHistory[historyIndex] = {
          ...state.transactionHistory[historyIndex],
          ...updates,
        }
      }
    },
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload
    },
    setTransactionError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload
    },
    clearPendingTransaction: (state) => {
      state.pendingTransaction = null
      state.isSubmitting = false
      state.lastError = null
      state.pendingSubmittedAt = null
      state.canRenotify = false
    },
    resetTransactions: () => initialState,
  },
})

export const {
  setPendingTransaction,
  setTransactionHistory,
  addToHistory,
  updateTransaction,
  setSubmitting,
  setTransactionError,
  clearPendingTransaction,
  resetTransactions,
  enableRenotify,
} = transactionSlice.actions

// Selectors
export const selectPendingTransaction = (state: RootState) => state.transaction.pendingTransaction
export const selectTransactionHistory = (state: RootState) => state.transaction.transactionHistory
export const selectIsSubmittingTransaction = (state: RootState) => state.transaction.isSubmitting
export const selectHasPendingTransaction = (state: RootState) =>
  state.transaction.pendingTransaction !== null &&
  state.transaction.pendingTransaction.status === 'pending'
export const selectTransactionError = (state: RootState) => state.transaction.lastError
export const selectPendingSubmittedAt = (state: RootState) => state.transaction.pendingSubmittedAt
export const selectCanRenotify = (state: RootState) => state.transaction.canRenotify

export default transactionSlice.reducer
