interface MetricCardProps {
  label: string
  value: number
  subtitle?: string
  variant?: 'income' | 'expense' | 'neutral' | 'positive' | 'negative'
  large?: boolean
}

const MetricCard = ({
  label,
  value,
  subtitle,
  variant = 'neutral',
  large = false,
}: MetricCardProps) => {
  const getColorClasses = () => {
    switch (variant) {
      case 'income':
      case 'positive':
        return 'text-green-600 border-green-200 bg-green-50'
      case 'expense':
      case 'negative':
        return 'text-red-600 border-red-200 bg-red-50'
      case 'neutral':
      default:
        return 'text-blue-600 border-blue-200 bg-blue-50'
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div
      className={`rounded-lg border-2 p-4 ${getColorClasses()}`}
      role="region"
      aria-label={label}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-600 mb-1">{label}</span>
        <span
          className={`font-bold ${large ? 'text-3xl' : 'text-2xl'}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {formatCurrency(value)}
        </span>
        {subtitle && <span className="text-xs text-gray-500 mt-1">{subtitle}</span>}
      </div>
    </div>
  )
}

export default MetricCard
