import { XCircle, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

interface TransactionRejectedModalProps {
  isOpen: boolean
  onClose: () => void
  rejectionNote: string
  transactionType: string
  transactionData?: Record<string, unknown>
}

export const TransactionRejectedModal = ({
  isOpen,
  onClose,
  rejectionNote,
  transactionType,
  transactionData,
}: TransactionRejectedModalProps) => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()

  if (!isOpen) return null

  const handleEditTransaction = () => {
    // Navigate back to the transaction form with pre-populated data
    const routeMap: Record<string, string> = {
      buy: 'buy',
      sell: 'sell',
      loan_take: 'loan',
      loan_payoff: 'payoff',
      market_event: 'market',
    }

    const route = routeMap[transactionType] || 'buy'
    navigate(`/game/${roomCode}/transaction/${route}`, {
      state: { rejectedData: transactionData },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-6 h-6" />
            <h2 className="text-lg font-bold">Transaction Rejected</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Your auditor has rejected this transaction. Please review their feedback and make the
            necessary corrections.
          </p>

          {/* Rejection Note */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-red-800 mb-2">Auditor's Feedback:</h3>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{rejectionNote}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleEditTransaction}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Edit Transaction
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
