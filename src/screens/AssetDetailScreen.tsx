import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { useGetPlayerQuery } from '@/services/gameApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import BottomNavBar from '@/components/BottomNavBar'
import { ArrowLeft, Building2, TrendingUp, Loader2, ArrowRight } from 'lucide-react'

const AssetDetailScreen = () => {
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

  const getAssetIcon = () => {
    return Building2
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
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Assets</h2>
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

  const totalAssetValue =
    player.assets?.reduce((sum, asset) => sum + asset.costBasis * asset.quantity, 0) || 0

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
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Assets</h1>
                <p className="text-sm text-gray-600">
                  {player.assets?.length || 0} asset{player.assets?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Assets List */}
        {player.assets && player.assets.length > 0 ? (
          <>
            {player.assets.map((asset, index) => {
              const Icon = getAssetIcon()
              const totalValue = asset.costBasis * asset.quantity
              const monthlyIncome = asset.monthlyIncome || 0

              return (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">{asset.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">
                          {asset.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Quantity</p>
                        <p className="font-semibold text-gray-900">{asset.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cost Basis</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(asset.costBasis)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Value</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(totalValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Monthly Income</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(monthlyIncome)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/game/${roomCode}/transaction/sell`)}
                    className="w-full bg-blue-50 text-blue-700 px-4 py-3 font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border-t border-blue-100"
                  >
                    Sell Asset
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <Building2 className="h-16 w-16 text-blue-300 mx-auto mb-4" />
            <h3 className="font-bold text-blue-900 mb-2">No Assets Yet</h3>
            <p className="text-sm text-blue-700 mb-6">
              Start building your wealth by purchasing income-generating assets!
            </p>
            <button
              onClick={() => navigate(`/game/${roomCode}/transaction/buy`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <TrendingUp className="h-5 w-5" />
              Buy Assets
            </button>
          </div>
        )}

        {/* Summary */}
        {player.assets && player.assets.length > 0 && (
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium mb-2 opacity-90">Portfolio Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs opacity-75 mb-1">Total Assets</p>
                <p className="text-2xl font-bold">{player.assets.length}</p>
              </div>
              <div>
                <p className="text-xs opacity-75 mb-1">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAssetValue)}</p>
              </div>
              <div className="col-span-2 pt-4 border-t border-white border-opacity-20">
                <p className="text-xs opacity-75 mb-1">Monthly Passive Income</p>
                <p className="text-2xl font-bold">{formatCurrency(player.passiveIncome)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavBar />
    </div>
  )
}

export default AssetDetailScreen
