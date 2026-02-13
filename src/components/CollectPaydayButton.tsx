import { DollarSign } from 'lucide-react'
import { useState } from 'react'

interface CollectPaydayButtonProps {
  paydayAmount: number
  onCollect: () => Promise<void>
  disabled?: boolean
}

const CollectPaydayButton = ({ paydayAmount, onCollect, disabled = false }: CollectPaydayButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    try {
      await onCollect()
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={`
        w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-3
        transition-all duration-200 shadow-lg
        ${isLoading || disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
        }
      `}
    >
      <DollarSign className="w-6 h-6" />
      <span>
        {isLoading ? 'Collecting...' : `Collect PAYDAY: ${formatCurrency(paydayAmount)}`}
      </span>
    </button>
  )
}

export default CollectPaydayButton