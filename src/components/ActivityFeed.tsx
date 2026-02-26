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

  const { data, isLoading, error } = useGetTransactionsQuery(
    { roomCode, limit },
    { pollingInterval: 10000 }
  )

  // Ensure transactions is always an array and map backend structure to frontend
  // Handle both direct array response and object wrapper response
  const rawTransactions = Array.isArray(data) ? data : (data as any)?.transactions || []

  // Map backend transaction structure to frontend expectations
  const transactions: Transaction[] = rawTransactions.map((tx: any) => {
    // Try to extract amount from description if needed (e.g., "PAYDAY collected: $1160")
    let extractedAmount = 0
    if (tx.description && typeof tx.description === 'string') {
      const match = tx.description.match(/\$?([\d,]+)/);
      if (match) {
        extractedAmount = parseFloat(match[1].replace(/,/g, ''))
        // For payday, this should be positive
        if (tx.type === 'payday') extractedAmount = Math.abs(extractedAmount)
      }
    }

    // Determine the cash delta based on available data
    const cashDelta =
      tx.amountsChanged?.cashOnHand ??
      tx.amountsChanged?.cash ??
      tx.financialImpact?.cashOnHandDelta ??
      extractedAmount ??
      0

    return {
      ...tx,
      id: tx._id || tx.id, // Map _id to id
      financialImpact: tx.financialImpact || {
        cashOnHandDelta: cashDelta,
        incomeDelta: tx.amountsChanged?.income || 0,
        expenseDelta: tx.amountsChanged?.expenses || 0,
      },
      details: {
        ...tx.details,
        amount: cashDelta,
        cashBefore: tx.cashBefore || tx.details?.cashBefore,
        cashAfter: tx.cashAfter || tx.details?.cashAfter,
      },
    }
  })

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
    // Use backend's description if provided
    if ((tx as any).description && typeof (tx as any).description === 'string') {
      // Remove the dollar amount from description since we show it separately
      return (tx as any).description.replace(/:\s*\$[\d,]+/, '')
    }

    // Fallback to generating description based on type
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">Failed to load transactions</p>
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
      {transactions.map((tx, index) => {
        const Icon = getTransactionIcon(tx.type)
        const colorClass = getTransactionColor(tx.type)
        const isExpanded = expandedId === tx.id

        // Calculate before/after if not provided
        const cashDelta = tx.financialImpact?.cashOnHandDelta || 0
        const cashBefore = tx.details?.cashBefore || tx.details?.previousCash || 0
        const cashAfter = tx.details?.cashAfter || (cashBefore + cashDelta)

        return (
          <div key={tx.id || `tx-${index}`} className="bg-white rounded-lg border border-gray-200">
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
                      {/* Display transaction amount clearly - check multiple possible sources */}
                      {(() => {
                        // Try to get amount from various possible sources
                        const amount =
                          tx.financialImpact?.cashOnHandDelta ??
                          tx.details?.amount ??
                          tx.details?.totalAmount ??
                          tx.details?.price ??
                          cashDelta;

                        if (amount !== undefined && amount !== 0) {
                          return (
                            <p className={`text-lg font-bold mt-1 ${
                              amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {amount >= 0 ? '+' : '-'}
                              {formatCurrency(Math.abs(amount))}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
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
            {isExpanded && (
              <div className="border-t border-gray-200 p-3 bg-gray-50 space-y-2">
                {/* Before/After Cash Totals */}
                {cashDelta !== 0 && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Before</p>
                        <p className="font-medium">
                          {formatCurrency(cashBefore)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Change</p>
                        <p className={`font-bold ${
                          cashDelta >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {cashDelta >= 0 ? '+' : ''}
                          {formatCurrency(cashDelta)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">After</p>
                        <p className="font-medium">
                          {formatCurrency(cashAfter)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {tx.financialImpact?.incomeDelta !== undefined &&
                  tx.financialImpact.incomeDelta !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Change:</span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(tx.financialImpact.incomeDelta)}
                      </span>
                    </div>
                  )}
                {tx.financialImpact?.expenseDelta !== undefined &&
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
