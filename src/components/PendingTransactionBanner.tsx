import { useEffect, useState } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import {
  selectPendingTransaction,
  selectPendingSubmittedAt,
  selectCanRenotify,
  enableRenotify,
} from '@/store/slices/transactionSlice'

const RENOTIFY_DELAY_MS = 5 * 60 * 1000 // 5 minutes

export const PendingTransactionBanner = () => {
  const dispatch = useAppDispatch()
  const pendingTransaction = useAppSelector(selectPendingTransaction)
  const submittedAt = useAppSelector(selectPendingSubmittedAt)
  const canRenotify = useAppSelector(selectCanRenotify)
  const [elapsedTime, setElapsedTime] = useState('')

  useEffect(() => {
    if (!submittedAt || !pendingTransaction) return

    // Update elapsed time every second
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - submittedAt
      const seconds = Math.floor(elapsed / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60

      setElapsedTime(`${minutes}:${remainingSeconds.toString().padStart(2, '0')}`)

      // Enable re-notify after 5 minutes
      if (elapsed >= RENOTIFY_DELAY_MS && !canRenotify) {
        dispatch(enableRenotify())
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [submittedAt, pendingTransaction, canRenotify, dispatch])

  const handleRenotify = () => {
    // TODO: Implement re-notify API call
    console.log('Re-notifying auditor...')
    // For now, just reset the timer
    dispatch(enableRenotify())
  }

  if (!pendingTransaction || pendingTransaction.status !== 'pending') {
    return null
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
      <div className="flex items-start">
        <Clock className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800">Transaction Pending Review</h3>
          <p className="text-sm text-amber-700 mt-1">
            Waiting for your auditor to review and approve this transaction.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-amber-600">Elapsed time: {elapsedTime}</span>
            {canRenotify && (
              <button
                onClick={handleRenotify}
                className="text-xs text-amber-700 underline hover:text-amber-900 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                Re-notify Auditor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
