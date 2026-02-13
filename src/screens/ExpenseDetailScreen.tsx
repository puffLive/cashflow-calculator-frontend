import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { useGetPlayerQuery } from '@/services/gameApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import BottomNavBar from '@/components/BottomNavBar'
import { ArrowLeft, TrendingDown, Loader2 } from 'lucide-react'

const ExpenseDetailScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const playerId = sessionStorage.getItem('playerId')

  const { isLoading, error } = useGetPlayerQuery(
    { roomCode: roomCode!, playerId: playerId! },
    { skip: !roomCode || !playerId, pollingInterval: 5000 }
  )

  const player = useAppSelector(selectCurrentPlayer)

  useEffect(() => {
    if (!playerId || !roomCode) {
      navigate('/')
    }
  }, [playerId, roomCode, navigate])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (isLoading && player.cashOnHand === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Expenses</h2>
          <button
            onClick={() => navigate(`/game/${roomCode}/dashboard`)}
            className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const expenseItems = player.expenses || []

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
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Expense Details</h1>
                <p className="text-sm text-gray-600">Total: {formatCurrency(player.totalExpenses)}/mo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-bold text-gray-900 mb-4">Monthly Expenses</h2>
          <div className="space-y-3">
            {expenseItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-bold text-red-600">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white">
          <h3 className="text-sm font-medium mb-2 opacity-90">Total Monthly Expenses</h3>
          <p className="text-3xl font-bold mb-4">{formatCurrency(player.totalExpenses)}</p>
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span>Number of Children:</span>
              <span className="font-semibold">{player.numberOfChildren || 0}</span>
            </div>
          </div>
        </div>

        {/* Fast Track Goal */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Fast Track Goal</h3>
          <p className="text-sm text-blue-800 mb-3">
            To escape the rat race, your passive income must exceed your total expenses.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-blue-700 mb-1">Passive Income</p>
              <p className="font-bold text-blue-900">{formatCurrency(player.passiveIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 mb-1">Total Expenses</p>
              <p className="font-bold text-blue-900">{formatCurrency(player.totalExpenses)}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (player.passiveIncome / player.totalExpenses) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-1 text-center">
              {Math.round((player.passiveIncome / player.totalExpenses) * 100)}% to Fast Track
            </p>
          </div>
        </div>
      </div>

      <BottomNavBar />
    </div>
  )
}

export default ExpenseDetailScreen
