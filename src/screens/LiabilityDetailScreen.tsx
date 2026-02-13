import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { useGetPlayerQuery } from '@/services/gameApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import BottomNavBar from '@/components/BottomNavBar'
import { ArrowLeft, CreditCard, Loader2, ArrowRight } from 'lucide-react'

const LiabilityDetailScreen = () => {
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
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Liabilities</h2>
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

  const totalDebt = player.liabilities?.reduce((sum, liability) => sum + liability.currentBalance, 0) || 0
  const totalMonthlyPayment = player.liabilities?.reduce((sum, liability) => sum + liability.monthlyPayment, 0) || 0

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
              <CreditCard className="h-5 w-5 text-red-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Liabilities</h1>
                <p className="text-sm text-gray-600">{player.liabilities?.length || 0} debt{player.liabilities?.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Liabilities List */}
        {player.liabilities && player.liabilities.length > 0 ? (
          <>
            {player.liabilities.map((liability, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-red-50 rounded-lg p-2">
                      <CreditCard className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1">{liability.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{liability.type.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Original Amount</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(liability.originalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                      <p className="font-bold text-red-600">{formatCurrency(liability.currentBalance)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Monthly Payment</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(liability.monthlyPayment)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {liability.originalAmount && (
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(0, ((liability.originalAmount - liability.currentBalance) / liability.originalAmount) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(((liability.originalAmount - liability.currentBalance) / liability.originalAmount) * 100)}% paid off
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/game/${roomCode}/transaction/payoff`)}
                  className="w-full bg-red-50 text-red-700 px-4 py-3 font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border-t border-red-100"
                >
                  Pay Off Debt
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="bg-green-100 rounded-full p-6 inline-flex mb-4">
              <CreditCard className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="font-bold text-green-900 mb-2">Debt Free! 🎉</h3>
            <p className="text-sm text-green-700">
              You have no outstanding debts. Keep up the great work!
            </p>
          </div>
        )}

        {/* Summary */}
        {player.liabilities && player.liabilities.length > 0 && (
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium mb-2 opacity-90">Debt Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs opacity-75 mb-1">Total Liabilities</p>
                <p className="text-2xl font-bold">{player.liabilities.length}</p>
              </div>
              <div>
                <p className="text-xs opacity-75 mb-1">Total Debt</p>
                <p className="text-2xl font-bold">{formatCurrency(totalDebt)}</p>
              </div>
              <div className="col-span-2 pt-4 border-t border-white border-opacity-20">
                <p className="text-xs opacity-75 mb-1">Monthly Debt Payments</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMonthlyPayment)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Debt Reduction Tip */}
        {player.liabilities && player.liabilities.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
            <p className="text-sm text-blue-800">
              Paying off debts reduces your monthly expenses and increases your cashflow. Focus on high-interest debts first for maximum impact.
            </p>
          </div>
        )}
      </div>

      <BottomNavBar />
    </div>
  )
}

export default LiabilityDetailScreen
