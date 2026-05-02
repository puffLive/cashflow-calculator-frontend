import { describe, it, expect } from 'vitest'
import reducer, {
  addPendingReview,
  removePendingReview,
  setCurrentReview,
  clearPendingReviews,
  setPendingReviews,
} from '@/store/slices/auditSlice'

const review = (over: Partial<any> = {}) => ({
  transactionId: 'tx-1',
  playerId: 'p1',
  playerName: 'Alice',
  transactionType: 'buy',
  transactionDetails: { foo: 'bar' },
  submittedAt: new Date().toISOString(),
  ...over,
})

describe('auditSlice', () => {
  it('initial state has no pending reviews', () => {
    const s = reducer(undefined, { type: '@@INIT' })
    expect(s.pendingReviews).toEqual([])
    expect(s.pendingCount).toBe(0)
    expect(s.isReviewing).toBe(false)
    expect(s.currentReview).toBeNull()
  })

  it('addPendingReview pushes onto the queue and bumps count', () => {
    let s = reducer(undefined, addPendingReview(review()))
    s = reducer(s, addPendingReview(review({ transactionId: 'tx-2' })))
    expect(s.pendingReviews).toHaveLength(2)
    expect(s.pendingCount).toBe(2)
  })

  it('addPendingReview deduplicates by transactionId', () => {
    let s = reducer(undefined, addPendingReview(review()))
    s = reducer(s, addPendingReview(review({ playerName: 'Should Not Replace' })))
    expect(s.pendingReviews).toHaveLength(1)
    expect(s.pendingReviews[0].playerName).toBe('Alice')
  })

  it('removePendingReview drops by transactionId and updates count', () => {
    let s = reducer(undefined, addPendingReview(review()))
    s = reducer(s, addPendingReview(review({ transactionId: 'tx-2' })))
    s = reducer(s, removePendingReview('tx-1'))
    expect(s.pendingReviews).toHaveLength(1)
    expect(s.pendingReviews[0].transactionId).toBe('tx-2')
    expect(s.pendingCount).toBe(1)
  })

  it('removePendingReview also clears currentReview if it matches', () => {
    let s = reducer(undefined, addPendingReview(review()))
    s = reducer(s, setCurrentReview(review()))
    expect(s.isReviewing).toBe(true)

    s = reducer(s, removePendingReview('tx-1'))
    expect(s.currentReview).toBeNull()
    expect(s.isReviewing).toBe(false)
  })

  it('setCurrentReview sets isReviewing to true; passing null clears it', () => {
    let s = reducer(undefined, setCurrentReview(review()))
    expect(s.isReviewing).toBe(true)
    expect(s.currentReview?.transactionId).toBe('tx-1')

    s = reducer(s, setCurrentReview(null))
    expect(s.isReviewing).toBe(false)
    expect(s.currentReview).toBeNull()
  })

  it('clearPendingReviews wipes everything', () => {
    let s = reducer(undefined, addPendingReview(review()))
    s = reducer(s, setCurrentReview(review()))
    s = reducer(s, clearPendingReviews())
    expect(s.pendingReviews).toEqual([])
    expect(s.pendingCount).toBe(0)
    expect(s.currentReview).toBeNull()
    expect(s.isReviewing).toBe(false)
  })

  it('setPendingReviews replaces the list and recomputes count', () => {
    const s = reducer(
      undefined,
      setPendingReviews([review(), review({ transactionId: 'tx-2' }), review({ transactionId: 'tx-3' })]),
    )
    expect(s.pendingReviews).toHaveLength(3)
    expect(s.pendingCount).toBe(3)
  })
})
