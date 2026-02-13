import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { useGetPlayerQuery } from '@/services/gameApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import BottomNavBar from '@/components/BottomNavBar'
import { ArrowLeft, DollarSign, TrendingUp, Loader2 } from 'lucide-react'

const IncomeDetailScreen = () => {
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
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Income</h2>
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
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Income Details</h1>
                <p className="text-sm text-gray-600">Total: {formatCurrency(player.totalIncome)}/mo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Salary Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h2 className="font-bold text-gray-900">Salary</h2>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Monthly Salary</span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(player.salary)}</span>
          </div>
        </div>

        {/* Passive Income Section */}
        {player.income && player.income.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h2 className="font-bold text-gray-900">Passive Income Sources</h2>
            </div>
            <div className="space-y-3">
              {player.income.map((source, index) => (
                <div key={index} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{source.name || 'Income Source'}</p>
                    <p className="text-xs text-gray-500 capitalize">{source.type?.replace('_', ' ')}</p>
                  </div>
                  <span className="font-bold text-green-600">{formatCurrency(source.amount)}/mo</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Passive Income</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(player.passiveIncome)}</span>
              </div>
            </div>
          </div>
        )}

        {player.income && player.income.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <TrendingUp className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <h3 className="font-semibold text-green-900 mb-1">No Passive Income Yet</h3>
            <p className="text-sm text-green-700">
              Buy income-generating assets to increase your passive income and escape the rat race!
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
          <h3 className="text-sm font-medium mb-2 opacity-90">Total Monthly Income</h3>
          <p className="text-3xl font-bold mb-4">{formatCurrency(player.totalIncome)}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="opacity-75 mb-1">Salary</p>
              <p className="font-semibold">{formatCurrency(player.salary)}</p>
            </div>
            <div>
              <p className="opacity-75 mb-1">Passive Income</p>
              <p className="font-semibold">{formatCurrency(player.passiveIncome)}</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavBar />
    </div>
  )
}

export default IncomeDetailScreen
