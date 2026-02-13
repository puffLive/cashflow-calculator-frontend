import { ArrowRight } from 'lucide-react'

interface FinancialImpact {
  cashOnHand: { before: number; after: number }
  totalIncome?: { before: number; after: number }
  totalExpenses?: { before: number; after: number }
  paydayAmount?: { before: number; after: number }
  cashflow?: { before: number; after: number }
}

interface TransactionImpactPreviewProps {
  impact: FinancialImpact
  assetDetails?: string
  liabilityDetails?: string
}

const TransactionImpactPreview = ({ impact, assetDetails, liabilityDetails }: TransactionImpactPreviewProps) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getDeltaColor = (before: number, after: number) => {
    const delta = after - before
    if (delta > 0) return 'text-green-600'
    if (delta < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const renderImpactRow = (label: string, before: number, after: number) => {
    const delta = after - before
    const deltaColor = getDeltaColor(before, after)

    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">{formatCurrency(before)}</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className={`text-sm font-semibold ${deltaColor}`}>
            {formatCurrency(after)}
          </span>
          {delta !== 0 && (
            <span className={`text-xs ${deltaColor} min-w-[60px] text-right`}>
              {delta > 0 ? '+' : ''}{formatCurrency(delta)}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Financial Impact</h3>

      <div className="space-y-2">
        {renderImpactRow('Cash on Hand', impact.cashOnHand.before, impact.cashOnHand.after)}

        {impact.totalIncome && renderImpactRow('Total Income', impact.totalIncome.before, impact.totalIncome.after)}

        {impact.totalExpenses && renderImpactRow('Total Expenses', impact.totalExpenses.before, impact.totalExpenses.after)}

        {impact.paydayAmount && renderImpactRow('PAYDAY Amount', impact.paydayAmount.before, impact.paydayAmount.after)}

        {impact.cashflow && renderImpactRow('Monthly Cashflow', impact.cashflow.before, impact.cashflow.after)}
      </div>

      {assetDetails && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-semibold text-green-800 mb-1">New Asset</h4>
          <p className="text-sm text-green-700">{assetDetails}</p>
        </div>
      )}

      {liabilityDetails && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-semibold text-red-800 mb-1">New Liability</h4>
          <p className="text-sm text-red-700">{liabilityDetails}</p>
        </div>
      )}
    </div>
  )
}

export default TransactionImpactPreview