import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { useGetPlayerQuery, useCollectPaydayMutation } from '@/services/gameApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import { selectPendingAuditCount } from '@/store/slices/auditSlice'
import { selectHasPendingTransaction } from '@/store/slices/transactionSlice'
import MetricCard from '@/components/MetricCard'
import CollectPaydayButton from '@/components/CollectPaydayButton'
import BottomNavBar from '@/components/BottomNavBar'
import TransactionFAB from '@/components/TransactionFAB'
import { Loader2 } from 'lucide-react'

const DashboardScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()

  // Get player data from session storage
  const playerId = sessionStorage.getItem('playerId')
  const playerName = sessionStorage.getItem('playerName')

  // Fetch player data (will update Redux state)
  const { isLoading, error } = useGetPlayerQuery(
    { roomCode: roomCode!, playerId: playerId! },
    { skip: !roomCode || !playerId, pollingInterval: 5000 }
  )

  const [collectPayday] = useCollectPaydayMutation()

  // Redux selectors - using Redux state as source of truth
  const player = useAppSelector(selectCurrentPlayer)
  const pendingAuditCount = useAppSelector(selectPendingAuditCount)
  const hasPendingTransaction = useAppSelector(selectHasPendingTransaction)

  useEffect(() => {
    if (!playerId || !playerName || !roomCode) {
      navigate('/')
    }
  }, [playerId, playerName, roomCode, navigate])

  const handleCollectPayday = async () => {
    if (!roomCode || !playerId) return

    try {
      await collectPayday({ roomCode, playerId }).unwrap()
      // Success notification would be handled by Socket.io event
    } catch (err) {
      console.error('Failed to collect payday:', err)
    }
  }

  if (isLoading && player.cashOnHand === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    )
  }

  if (error && player.cashOnHand === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">Failed to load player data</p>
          <button
            onClick={() => navigate(`/game/${roomCode}/lobby`)}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{playerName}</h1>
              <p className="text-sm text-gray-600">{player.profession || 'Professional'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Room Code</p>
              <p className="text-lg font-mono font-bold text-blue-600">{roomCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1">
            <MetricCard
              label="Cash on Hand"
              value={player.cashOnHand}
              variant="neutral"
              large
            />
          </div>
          <MetricCard
            label="PAYDAY Amount"
            value={player.paydayAmount}
            variant="income"
          />
          <MetricCard
            label="Cashflow"
            value={player.cashflow}
            variant={player.cashflow >= 0 ? 'positive' : 'negative'}
            subtitle={`${player.isOnFastTrack ? '✓ On Fast Track!' : 'Rat Race'}`}
          />
          <MetricCard
            label="Total Income"
            value={player.totalIncome}
            variant="income"
          />
          <MetricCard
            label="Total Expenses"
            value={player.totalExpenses}
            variant="expense"
          />
          <MetricCard
            label="Passive Income"
            value={player.passiveIncome}
            variant="positive"
            subtitle={`Goal: $${player.totalExpenses.toLocaleString()}`}
          />
        </div>

        {/* Fast Track Progress */}
        {player.passiveIncome > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Fast Track Progress</span>
              <span className="text-xs text-gray-500">
                {Math.min(100, Math.round((player.passiveIncome / player.totalExpenses) * 100))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  player.isOnFastTrack ? 'bg-green-600' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(100, (player.passiveIncome / player.totalExpenses) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Passive Income: ${player.passiveIncome.toLocaleString()} / Expenses: ${player.totalExpenses.toLocaleString()}
            </p>
          </div>
        )}

        {/* Collect PAYDAY Button */}
        <CollectPaydayButton
          paydayAmount={player.paydayAmount}
          onCollect={handleCollectPayday}
        />

        {/* Pending Transaction Warning */}
        {hasPendingTransaction && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium">
              ⏳ You have a transaction pending audit approval
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <BottomNavBar pendingAuditCount={pendingAuditCount} />

      {/* Transaction FAB */}
      <TransactionFAB
        disabled={hasPendingTransaction}
        disabledTooltip="Waiting for auditor to review your pending transaction"
      />
    </div>
  )
}

export default DashboardScreen