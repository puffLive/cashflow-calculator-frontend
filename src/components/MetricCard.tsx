import { useEffect, useRef, useState } from 'react'

interface MetricCardProps {
  label: string
  value: number
  subtitle?: string
  variant?: 'income' | 'expense' | 'neutral' | 'positive' | 'negative'
  large?: boolean
}

/**
 * Brief green-flash on the value when it changes. Triggered after the
 * `transaction:finalized` socket event lands (Feature 10.3.6) so the user
 * sees their pending values "settle" into the new totals — easy to miss
 * otherwise on a multi-card dashboard. The first render is excluded so
 * mounting the dashboard doesn't flash everything at once.
 */
const FLASH_DURATION_MS = 800

const MetricCard = ({
  label,
  value,
  subtitle,
  variant = 'neutral',
  large = false,
}: MetricCardProps) => {
  const previousValueRef = useRef(value)
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    if (previousValueRef.current !== value) {
      previousValueRef.current = value
      setIsFlashing(true)
      const timeout = setTimeout(() => setIsFlashing(false), FLASH_DURATION_MS)
      return () => clearTimeout(timeout)
    }
  }, [value])

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
          className={`font-bold transition-colors duration-700 ${large ? 'text-3xl' : 'text-2xl'} ${
            isFlashing ? 'bg-green-200 rounded px-1' : ''
          }`}
          aria-live="polite"
          aria-atomic="true"
          data-testid="metric-value"
          data-flashing={isFlashing ? 'true' : 'false'}
        >
          {formatCurrency(value)}
        </span>
        {subtitle && <span className="text-xs text-gray-500 mt-1">{subtitle}</span>}
      </div>
    </div>
  )
}

export default MetricCard
