import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { selectPendingReviews } from '@/store/slices/auditSlice'
import { useAuditTransactionMutation } from '@/services/transactionApi'
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react'

const AuditReviewScreen = () => {
  const navigate = useNavigate()
  const { roomCode, transactionId } = useParams<{ roomCode: string; transactionId: string }>()
  const pendingReviews = useAppSelector(selectPendingReviews)
  const [auditTransaction, { isLoading }] = useAuditTransactionMutation()
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')

  // Get auditor ID from session storage
  const auditorId = sessionStorage.getItem('playerId')

  const review = pendingReviews.find((r: { transactionId: string }) => r.transactionId === transactionId)

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-6">This transaction is no longer available for review.</p>
          <button
            onClick={() => navigate(`/game/${roomCode}/audits`)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Pending Audits
          </button>
        </div>
      </div>
    )
  }

  const handleApprove = async () => {
    if (!roomCode || !transactionId || !auditorId) return

    try {
      await auditTransaction({
        roomCode,
        transactionId,
        auditorId,
        action: 'approve'
      }).unwrap()

      navigate(`/game/${roomCode}/audits`)
    } catch (err) {
      console.error('Failed to approve transaction:', err)
    }
  }

  const handleReject = async () => {
    if (!roomCode || !transactionId || !auditorId || !rejectionNote.trim()) return

    try {
      await auditTransaction({
        roomCode,
        transactionId,
        auditorId,
        action: 'reject',
        note: rejectionNote
      }).unwrap()

      navigate(`/game/${roomCode}/audits`)
    } catch (err) {
      console.error('Failed to reject transaction:', err)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/game/${roomCode}/audits`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Review Transaction</h1>
              <p className="text-sm text-gray-600">{review.playerName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Transaction Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Transaction Details</h2>
            <span className="text-sm text-gray-500">{formatTimestamp(review.submittedAt)}</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Player:</span> {review.playerName}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Type:</span> {review.transactionType}
            </p>
          </div>
        </div>

        {/* Transaction Data */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-3">Transaction Information</h3>
          <div className="space-y-2">
            {Object.entries(review.transactionDetails).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="font-medium text-gray-900">
                  {typeof value === 'number' ? formatCurrency(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Summary Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Note:</span> Review all transaction details carefully before approving.
            This will permanently update the player's financial statement.
          </p>
        </div>
      </div>

      {/* Reject Input */}
      {showRejectInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rejection Reason</h3>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Explain why you're rejecting this transaction..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectInput(false)
                  setRejectionNote('')
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionNote.trim() || isLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-3">
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="w-full bg-green-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Check className="h-6 w-6" />
          {isLoading ? 'Approving...' : 'Approve Transaction'}
        </button>
        <button
          onClick={() => setShowRejectInput(true)}
          disabled={isLoading}
          className="w-full bg-red-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <X className="h-6 w-6" />
          Reject Transaction
        </button>
      </div>
    </div>
  )
}

export default AuditReviewScreen
