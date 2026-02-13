import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, ShoppingCart, TrendingDown, Coins, Zap, X } from 'lucide-react'

interface TransactionFABProps {
  disabled?: boolean
  disabledTooltip?: string
}

const TransactionFAB = ({ disabled = false, disabledTooltip }: TransactionFABProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()

  const actions = [
    { id: 'buy', label: 'Buy', icon: ShoppingCart, color: 'bg-green-500 hover:bg-green-600', path: `/game/${roomCode}/transaction/buy` },
    { id: 'sell', label: 'Sell', icon: TrendingDown, color: 'bg-blue-500 hover:bg-blue-600', path: `/game/${roomCode}/transaction/sell` },
    { id: 'loan', label: 'Loan', icon: Coins, color: 'bg-yellow-500 hover:bg-yellow-600', path: `/game/${roomCode}/transaction/loan` },
    { id: 'event', label: 'Event', icon: Zap, color: 'bg-purple-500 hover:bg-purple-600', path: `/game/${roomCode}/transaction/event` }
  ]

  const handleActionClick = (path: string) => {
    setIsExpanded(false)
    navigate(path)
  }

  const handleMainButtonClick = () => {
    if (disabled) return
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Action Menu */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 flex flex-col space-y-3 mb-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.path)}
                aria-label={`${action.label} transaction`}
                className={`
                  ${action.color} text-white rounded-full p-3 shadow-lg
                  flex items-center space-x-2 pr-4
                  transition-all duration-200 transform
                  animate-in slide-in-from-bottom-2 fade-in
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Main FAB Button */}
      <div className="relative">
        <button
          onClick={handleMainButtonClick}
          disabled={disabled}
          aria-label={isExpanded ? 'Close transaction menu' : 'Open transaction menu'}
          aria-expanded={isExpanded}
          className={`
            w-14 h-14 rounded-full shadow-lg flex items-center justify-center
            transition-all duration-300 transform
            ${disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }
            ${isExpanded ? 'rotate-45' : 'rotate-0'}
          `}
          title={disabled ? disabledTooltip : 'New Transaction'}
        >
          {isExpanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Disabled Tooltip */}
        {disabled && disabledTooltip && (
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            {disabledTooltip}
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}

export default TransactionFAB