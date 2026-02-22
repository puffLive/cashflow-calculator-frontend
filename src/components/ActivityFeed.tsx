import { useState } from 'react'
import type { Transaction } from '@/services/transactionApi'
import { useGetTransactionsQuery } from '@/services/transactionApi'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'

interface ActivityFeedProps {
  roomCode: string
  limit?: number
}

const ActivityFeed = ({ roomCode, limit = 20 }: ActivityFeedProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: transactions = [], isLoading } = useGetTransactionsQuery(
    { roomCode, limit },
    { pollingInterval: 10000 }
  )

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

  const getTransactionDescription = (tx: Transaction) => {
    switch (tx.type) {
      case 'buy':
        return `bought ${tx.details.assetType || 'asset'}`
      case 'sell':
        return `sold ${tx.details.assetType || 'asset'}`
      case 'payday':
        return 'collected PAYDAY'
      case 'loan':
        if (tx.subType === 'payoff') {
          return 'paid off loan'
        }
        return 'took a loan'
      case 'market_event':
        return `${tx.subType?.replace('_', ' ') || 'market event'}`
      default:
        return tx.type
    }
  }

  const getTransactionAmount = (tx: Transaction): { amount: number; label: string } | null => {
    if (tx.financialImpact?.cashOnHandDelta !== undefined) {
      return {
        amount: tx.financialImpact.cashOnHandDelta,
        label: tx.financialImpact.cashOnHandDelta >= 0 ? '+' : '',
      }
    }
    return null
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
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <Zap className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-gray-900 mb-1">No Activity Yet</h3>
        <p className="text-xs text-gray-500">Recent transactions will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const Icon = getTransactionIcon(tx.type)
        const colorClass = getTransactionColor(tx.type)
        const amountInfo = getTransactionAmount(tx)
        const isExpanded = expandedId === tx.id

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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getTransactionDescription(tx)}
                      </p>
                      <p className="text-xs text-gray-500">{formatTimestamp(tx.timestamp)}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {amountInfo && (
                        <span
                          className={`text-sm font-bold ${
                            amountInfo.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {amountInfo.label}
                          {formatCurrency(amountInfo.amount)}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-1">
                    {tx.status === 'approved' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                        ✓ Approved
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                        ⏳ Pending
                      </span>
                    )}
                    {tx.status === 'rejected' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                        ✗ Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && tx.financialImpact && (
              <div className="border-t border-gray-200 p-3 bg-gray-50 text-xs space-y-2">
                {tx.financialImpact.cashOnHandDelta !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash Change:</span>
                    <span
                      className={`font-medium ${
                        tx.financialImpact.cashOnHandDelta >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.financialImpact.cashOnHandDelta >= 0 ? '+' : ''}
                      {formatCurrency(tx.financialImpact.cashOnHandDelta)}
                    </span>
                  </div>
                )}
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
      })}
    </div>
  )
}

export default ActivityFeed
