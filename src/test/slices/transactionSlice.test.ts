import { describe, it, expect } from 'vitest'
import transactionReducer, {
  setPendingTransaction,
  enableRenotify,
  clearPendingTransaction,
  selectHasPendingTransaction,
  selectCanRenotify,
} from '@/store/slices/transactionSlice'
import type { Transaction } from '@/services/transactionApi'

describe('transactionSlice', () => {
  const mockTransaction: Transaction = {
    id: 'tx-123',
    roomCode: 'TEST123',
    type: 'buy',
    status: 'pending',
    timestamp: new Date().toISOString(),
    playerId: 'player-1',
    details: {},
  }

  it('should handle initial state', () => {
    expect(transactionReducer(undefined, { type: 'unknown' })).toEqual({
      pendingTransaction: null,
      transactionHistory: [],
      isSubmitting: false,
      lastError: null,
      pendingSubmittedAt: null,
      canRenotify: false,
    })
  })

  it('should handle setPendingTransaction', () => {
    const actual = transactionReducer(undefined, setPendingTransaction(mockTransaction))
    expect(actual.pendingTransaction).toEqual(mockTransaction)
    expect(actual.pendingSubmittedAt).toBeTruthy()
    expect(actual.canRenotify).toBe(false)
  })

  it('should handle enableRenotify', () => {
    const initialState = transactionReducer(undefined, setPendingTransaction(mockTransaction))
    const actual = transactionReducer(initialState, enableRenotify())
    expect(actual.canRenotify).toBe(true)
  })

  it('should handle clearPendingTransaction', () => {
    const initialState = transactionReducer(undefined, setPendingTransaction(mockTransaction))
    const actual = transactionReducer(initialState, clearPendingTransaction())
    expect(actual.pendingTransaction).toBeNull()
    expect(actual.pendingSubmittedAt).toBeNull()
    expect(actual.canRenotify).toBe(false)
  })

  it('should correctly select hasPendingTransaction', () => {
    const state = {
      transaction: {
        pendingTransaction: mockTransaction,
        transactionHistory: [],
        isSubmitting: false,
        lastError: null,
        pendingSubmittedAt: Date.now(),
        canRenotify: false,
      },
    } as any

    expect(selectHasPendingTransaction(state)).toBe(true)
  })

  it('should correctly select canRenotify', () => {
    const state = {
      transaction: {
        pendingTransaction: mockTransaction,
        transactionHistory: [],
        isSubmitting: false,
        lastError: null,
        pendingSubmittedAt: Date.now(),
        canRenotify: true,
      },
    } as any

    expect(selectCanRenotify(state)).toBe(true)
  })

  it('should not have pending transaction when status is not pending', () => {
    const approvedTransaction = { ...mockTransaction, status: 'approved' as const }
    const state = {
      transaction: {
        pendingTransaction: approvedTransaction,
        transactionHistory: [],
        isSubmitting: false,
        lastError: null,
        pendingSubmittedAt: Date.now(),
        canRenotify: false,
      },
    } as any

    expect(selectHasPendingTransaction(state)).toBe(false)
  })
})
