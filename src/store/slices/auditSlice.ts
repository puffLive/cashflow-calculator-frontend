import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { Transaction } from '@/services/transactionApi'

interface PendingAudit {
  transactionId: string
  playerId: string
  playerName: string
  transactionType: Transaction['type']
  transactionDetails: Record<string, any>
  submittedAt: string
}

interface AuditState {
  pendingReviews: PendingAudit[]
  pendingCount: number
  isReviewing: boolean
  currentReview: PendingAudit | null
}

const initialState: AuditState = {
  pendingReviews: [],
  pendingCount: 0,
  isReviewing: false,
  currentReview: null,
}

export const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    addPendingReview: (state, action: PayloadAction<PendingAudit>) => {
      state.pendingReviews.push(action.payload)
      state.pendingCount = state.pendingReviews.length
    },
    removePendingReview: (state, action: PayloadAction<string>) => {
      state.pendingReviews = state.pendingReviews.filter(
        review => review.transactionId !== action.payload
      )
      state.pendingCount = state.pendingReviews.length
      if (state.currentReview?.transactionId === action.payload) {
        state.currentReview = null
        state.isReviewing = false
      }
    },
    setCurrentReview: (state, action: PayloadAction<PendingAudit | null>) => {
      state.currentReview = action.payload
      state.isReviewing = action.payload !== null
    },
    clearPendingReviews: (state) => {
      state.pendingReviews = []
      state.pendingCount = 0
      state.currentReview = null
      state.isReviewing = false
    },
    setPendingReviews: (state, action: PayloadAction<PendingAudit[]>) => {
      state.pendingReviews = action.payload
      state.pendingCount = action.payload.length
    },
  },
})

export const {
  addPendingReview,
  removePendingReview,
  setCurrentReview,
  clearPendingReviews,
  setPendingReviews,
} = auditSlice.actions

// Selectors
export const selectPendingReviews = (state: RootState) => state.audit.pendingReviews
export const selectPendingAuditCount = (state: RootState) => state.audit.pendingCount
export const selectCurrentReview = (state: RootState) => state.audit.currentReview
export const selectIsReviewing = (state: RootState) => state.audit.isReviewing

export default auditSlice.reducer