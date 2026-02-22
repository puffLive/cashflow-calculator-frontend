import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetTransactionsQuery, useUndoTransactionMutation } from '@/services/transactionApi'
import type { Transaction } from '@/services/transactionApi'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Zap,
  Check,
  X,
  Clock,
  AlertCircle,
} from 'lucide-react'
import BottomNavBar from '@/components/BottomNavBar'

const TransactionHistoryScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const playerId = sessionStorage.getItem('playerId')

  const [filterType, setFilterType] = useState<Transaction['type'] | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)

  const { data: transactions = [], isLoading } = useGetTransactionsQuery(
    { roomCode: roomCode!, playerId: playerId || undefined, limit: 100 },
    { skip: !roomCode || !playerId, pollingInterval: 10000 }
  )

  const [undoTransaction, { isLoading: isUndoing }] = useUndoTransactionMutation()

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'buy':
        return TrendingUp
      case 'sell':
        return TrendingDown
      case 'payday':
        return DollarSign
      case 'loan':
        return Building2
      case 'market_event':
        return Zap
      default:
        return DollarSign
    }
  }

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'buy':
        return 'text-green-600 bg-green-50'
      case 'sell':
        return 'text-blue-600 bg-blue-50'
      case 'payday':
        return 'text-emerald-600 bg-emerald-50'
      case 'loan':
        return 'text-red-600 bg-red-50'
      case 'market_event':
        return 'text-amber-600 bg-amber-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
            <Check className="h-3 w-3" /> Approved
          </span>
        )
      case 'pending':
        return (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </span>
        )
      case 'rejected':
        return (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
            <X className="h-3 w-3" /> Rejected
          </span>
        )
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value))
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getTransactionDescription = (tx: Transaction) => {
    switch (tx.type) {
      case 'buy':
        return `Bought ${tx.details.assetType || 'asset'}`
      case 'sell':
        return `Sold ${tx.details.assetType || 'asset'}`
      case 'payday':
        return 'Collected PAYDAY'
      case 'loan':
        return tx.subType === 'payoff' ? 'Paid off loan' : 'Took a loan'
      case 'market_event':
        return `${tx.subType?.replace('_', ' ') || 'Market event'}`
      default:
        return tx.type
    }
  }

  const filteredTransactions = transactions
    .filter((tx) => filterType === 'all' || tx.type === filterType)
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  const lastApprovedTransaction = transactions
    .filter((tx) => tx.status === 'approved')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

  const handleUndo = async () => {
    if (!roomCode || !playerId || !lastApprovedTransaction) return

    try {
      await undoTransaction({ roomCode, playerId }).unwrap()
      setShowUndoConfirm(false)
    } catch (err) {
      console.error('Failed to undo transaction:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
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
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Transaction History</h1>
              <p className="text-sm text-gray-600">
                {filteredTransactions.length} transaction
                {filteredTransactions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Filter by Type</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'buy', 'sell', 'loan', 'payday', 'market_event'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Sort Order</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortOrder('newest')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortOrder === 'newest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => setSortOrder('oldest')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortOrder === 'oldest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Oldest First
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Undo Button */}
      {lastApprovedTransaction && (
        <div className="px-4 pt-4">
          <button
            onClick={() => setShowUndoConfirm(true)}
            disabled={isUndoing}
            className="w-full bg-amber-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            {isUndoing ? 'Undoing...' : 'Undo Last Transaction'}
          </button>
        </div>
      )}

      {/* Transaction List */}
      <div className="px-4 py-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Transactions</h3>
            <p className="text-gray-600 text-sm">Your transaction history will appear here</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const Icon = getTransactionIcon(tx.type)
            const colorClass = getTransactionColor(tx.type)
            const isExpanded = expandedId === tx.id
            const cashDelta = tx.financialImpact?.cashOnHandDelta

            return (
              <div key={tx.id} className="bg-white rounded-lg border border-gray-200">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                  className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getTransactionDescription(tx)}
                          </p>
                          <p className="text-xs text-gray-500">{formatTimestamp(tx.timestamp)}</p>
                        </div>
                        {cashDelta !== undefined && (
                          <span
                            className={`text-sm font-bold ${cashDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {cashDelta >= 0 ? '+' : ''}
                            {formatCurrency(cashDelta)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        {getStatusBadge(tx.status)}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && tx.financialImpact && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50 text-xs space-y-2">
                    {tx.financialImpact.incomeDelta !== undefined &&
                      tx.financialImpact.incomeDelta !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Income Change:</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(tx.financialImpact.incomeDelta)}
                          </span>
                        </div>
                      )}
                    {tx.financialImpact.expenseDelta !== undefined &&
                      tx.financialImpact.expenseDelta !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expense Change:</span>
                          <span className="font-medium text-red-600">
                            +{formatCurrency(tx.financialImpact.expenseDelta)}
                          </span>
                        </div>
                      )}
                    {tx.auditorNote && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-gray-600 mb-1">Auditor Note:</p>
                        <p className="text-gray-900 italic">{tx.auditorNote}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Undo Confirmation Modal */}
      {showUndoConfirm && lastApprovedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Undo Transaction?</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-900 mb-2">
                <span className="font-semibold">This will reverse:</span>
              </p>
              <p className="text-sm text-amber-800">
                {getTransactionDescription(lastApprovedTransaction)}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {formatTimestamp(lastApprovedTransaction.timestamp)}
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This will reverse all financial changes and require auditor approval. This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUndoConfirm(false)}
                disabled={isUndoing}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUndo}
                disabled={isUndoing}
                className="flex-1 bg-amber-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isUndoing ? 'Undoing...' : 'Confirm Undo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  )
}

export default TransactionHistoryScreen
