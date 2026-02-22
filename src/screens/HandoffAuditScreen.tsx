import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuditTransactionMutation } from '@/services/transactionApi'
import { Check, X, ArrowLeft } from 'lucide-react'

interface LocationState {
  transactionId: string
  playerName: string
  transactionType: string
  transactionDetails: Record<string, any>
}

const HandoffAuditScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const location = useLocation()
  const state = location.state as LocationState

  const [auditTransaction, { isLoading }] = useAuditTransactionMutation()
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')

  // Get auditor ID from session storage
  const auditorId = sessionStorage.getItem('playerId') || ''

  if (!state) {
    navigate(`/game/${roomCode}/dashboard`)
    return null
  }

  const { transactionId, playerName, transactionType, transactionDetails } = state

  const handleApprove = async () => {
    if (!roomCode || !transactionId || !auditorId) return

    try {
      await auditTransaction({
        roomCode,
        transactionId,
        auditorId,
        action: 'approve',
      }).unwrap()

      navigate(`/game/${roomCode}/dashboard`)
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
        note: rejectionNote,
      }).unwrap()

      navigate(`/game/${roomCode}/dashboard`)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 pb-32">
      {/* Distinct Header for Auditor Mode */}
      <div className="bg-purple-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(`/game/${roomCode}/dashboard`)}
              className="p-2 hover:bg-purple-600 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">AUDITOR REVIEW</h1>
              <p className="text-sm text-purple-200">Reviewing {playerName}'s transaction</p>
            </div>
          </div>
          <div className="bg-purple-800 bg-opacity-50 rounded-lg px-3 py-2">
            <p className="text-xs text-purple-100">
              👤 You are now reviewing as the auditor. Carefully verify all details before
              approving.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Transaction Header */}
        <div className="bg-white rounded-lg border-2 border-purple-300 p-4 shadow-md">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Transaction Details</h2>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Player:</span> {playerName}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Type:</span> {transactionType}
            </p>
          </div>
        </div>

        {/* Transaction Data */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-md">
          <h3 className="font-bold text-gray-900 mb-3">Transaction Information</h3>
          <div className="space-y-2">
            {Object.entries(transactionDetails).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="font-medium text-gray-900">
                  {typeof value === 'number' ? formatCurrency(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Summary Note */}
        <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
          <p className="text-sm text-purple-900">
            <span className="font-semibold">⚠️ Important:</span> This is same-device audit mode.
            After reviewing, you can return the device to the player.
          </p>
        </div>
      </div>

      {/* Reject Input Modal */}
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-purple-300 p-4 space-y-3">
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="w-full bg-green-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          <Check className="h-6 w-6" />
          {isLoading ? 'Approving...' : 'Approve Transaction'}
        </button>
        <button
          onClick={() => setShowRejectInput(true)}
          disabled={isLoading}
          className="w-full bg-red-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          <X className="h-6 w-6" />
          Reject Transaction
        </button>
        <button
          onClick={() => navigate(`/game/${roomCode}/dashboard`)}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Return to Player Dashboard
        </button>
      </div>
    </div>
  )
}

export default HandoffAuditScreen
