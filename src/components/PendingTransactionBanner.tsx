import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Clock, AlertCircle } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import {
  selectPendingTransaction,
  selectPendingSubmittedAt,
  selectCanRenotify,
  selectLastRenotifiedAt,
  enableRenotify,
  markRenotified,
} from '@/store/slices/transactionSlice'
import { addNotification } from '@/store/slices/uiSlice'
import { useRenotifyTransactionMutation } from '@/services/transactionApi'

const RENOTIFY_DELAY_MS = 5 * 60 * 1000 // 5 minutes

export const PendingTransactionBanner = () => {
  const dispatch = useAppDispatch()
  const { roomCode } = useParams<{ roomCode: string }>()
  const pendingTransaction = useAppSelector(selectPendingTransaction)
  const submittedAt = useAppSelector(selectPendingSubmittedAt)
  const lastRenotifiedAt = useAppSelector(selectLastRenotifiedAt)
  const canRenotify = useAppSelector(selectCanRenotify)
  const [elapsedTime, setElapsedTime] = useState('')
  const [renotify, { isLoading: isRenotifying }] = useRenotifyTransactionMutation()

  useEffect(() => {
    if (!submittedAt || !pendingTransaction) return

    // The 5-min cooldown anchor is the most recent of (submission, last
    // re-notify). After a re-notify lands, the timer restarts so the user
    // can't spam the auditor every second.
    const anchor = Math.max(submittedAt, lastRenotifiedAt ?? 0)

    // Update elapsed time every second
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - submittedAt
      const seconds = Math.floor(elapsed / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60

      setElapsedTime(`${minutes}:${remainingSeconds.toString().padStart(2, '0')}`)

      // Enable re-notify after 5 minutes since the cooldown anchor
      if (now - anchor >= RENOTIFY_DELAY_MS && !canRenotify) {
        dispatch(enableRenotify())
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [submittedAt, lastRenotifiedAt, pendingTransaction, canRenotify, dispatch])

  const handleRenotify = async () => {
    if (!roomCode || !pendingTransaction) return
    const playerId = sessionStorage.getItem('playerId')
    if (!playerId) return

    try {
      const result = await renotify({
        roomCode,
        transactionId: pendingTransaction.id,
        playerId,
      }).unwrap()

      dispatch(
        addNotification({
          id: `renotify-${Date.now()}`,
          type: result.auditorReachable ? 'success' : 'warning',
          message: result.auditorReachable
            ? 'Auditor re-notified'
            : 'Auditor is offline — they’ll see the request when they reconnect',
          duration: 4000,
        }),
      )
      // Hide the button + restart the 5-min cooldown anchor. The
      // elapsed-time effect re-enables `canRenotify` once another 5 min
      // passes (relative to `lastRenotifiedAt`).
      dispatch(markRenotified())
    } catch (err: any) {
      const message =
        err?.data?.message ?? err?.data?.error ?? 'Failed to re-notify auditor'
      dispatch(
        addNotification({
          id: `renotify-err-${Date.now()}`,
          type: 'error',
          message,
          duration: 5000,
        }),
      )
    }
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
                disabled={isRenotifying}
                className="text-xs text-amber-700 underline hover:text-amber-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {isRenotifying ? 'Re-notifying...' : 'Re-notify Auditor'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
