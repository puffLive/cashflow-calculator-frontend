import { useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { selectPendingReviews } from '@/store/slices/auditSlice'
import type { Transaction } from '@/services/transactionApi'
import {
  ArrowLeft,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Zap,
} from 'lucide-react'

const PendingAuditsScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const pendingReviews = useAppSelector(selectPendingReviews)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return TrendingUp
      case 'sell':
        return TrendingDown
      case 'loan':
        return Building2
      case 'market_event':
        return Zap
      default:
        return DollarSign
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'text-green-700'
      case 'sell':
        return 'text-blue-700'
      case 'loan':
        return 'text-red-700'
      case 'market_event':
        return 'text-amber-700'
      default:
        return 'text-gray-700'
    }
  }

  const getTransactionLabel = (type: string, details?: Record<string, any>) => {
    // Check for collect money (e-transfer) based on subType
    if (type === 'market_event' && details?.subType === 'lend_collect') {
      return 'E-Transfer'
    }

    // Handle loan subtypes
    if (type === 'loan' && details?.subType) {
      switch (details.subType) {
        case 'loan_take':
          return 'Take Loan'
        case 'loan_payoff':
          return 'Pay Off Loan'
        default:
          return 'Loan Transaction'
      }
    }

    // Handle buy/sell subtypes
    if (details?.subType) {
      const formatted = details.subType
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      return formatted
    }

    switch (type) {
      case 'buy':
        return 'Buy Transaction'
      case 'sell':
        return 'Sell Transaction'
      case 'loan':
        return 'Loan Transaction'
      case 'market_event':
        return 'Market Event'
      case 'payday':
        return 'PAYDAY'
      default:
        return type
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (pendingReviews.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/game/${roomCode}/dashboard`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Pending Audits</h1>
                <p className="text-sm text-gray-600">Review transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <div className="bg-gray-200 rounded-full p-6 mb-4">
            <Clock className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Pending Audits</h2>
          <p className="text-gray-600 text-center">
            You don't have any transactions to review at the moment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/game/${roomCode}/dashboard`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Pending Audits</h1>
              <p className="text-sm text-gray-600">
                {pendingReviews.length} transaction{pendingReviews.length !== 1 ? 's' : ''} to
                review
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reviews List */}
      <div className="px-4 py-4 space-y-3">
        {pendingReviews.map(
          (review: {
            transactionId: string
            playerName: string
            transactionType: Transaction['type']
            transactionDetails?: Record<string, any>
            submittedAt: string
          }) => {
            const Icon = getTransactionIcon(review.transactionType)
            const colorClass = getTransactionColor(review.transactionType)

            return (
              <div
                key={review.transactionId}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gray-50 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="font-semibold text-gray-900">{review.playerName}</h3>
                        <p className="text-sm text-gray-600">
                          {getTransactionLabel(review.transactionType, review.transactionDetails)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(review.submittedAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/game/${roomCode}/audit/${review.transactionId}`)}
                      className="mt-3 w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Review Transaction
                    </button>
                  </div>
                </div>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}

export default PendingAuditsScreen
