import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { useGetPlayerQuery } from '@/services/gameApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import { selectPendingAuditCount } from '@/store/slices/auditSlice'
import { selectHasPendingTransaction } from '@/store/slices/transactionSlice'
import { resetUI } from '@/store/slices/uiSlice'
import BottomNavBar from '@/components/BottomNavBar'
import TransactionFAB from '@/components/TransactionFAB'
import { Loader2, LogOut } from 'lucide-react'

const DashboardScreen = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { roomCode } = useParams<{ roomCode: string }>()
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false)

  // Get player data from session storage
  const playerId = sessionStorage.getItem('playerId')
  const playerName = sessionStorage.getItem('playerName')

  // Fetch player data (will update Redux state)
  const { isLoading, error } = useGetPlayerQuery(
    { roomCode: roomCode!, playerId: playerId! },
    { skip: !roomCode || !playerId, pollingInterval: 5000 }
  )

  // Redux selectors - using Redux state as source of truth
  const player = useAppSelector(selectCurrentPlayer)
  const pendingAuditCount = useAppSelector(selectPendingAuditCount)
  const hasPendingTransaction = useAppSelector(selectHasPendingTransaction)

  useEffect(() => {
    if (!playerId || !playerName || !roomCode) {
      navigate('/')
    }
  }, [playerId, playerName, roomCode, navigate])

  const handleNewGame = () => {
    // Clear all session data
    sessionStorage.removeItem('playerId')
    sessionStorage.removeItem('playerName')
    sessionStorage.removeItem('roomCode')

    // Reset UI state
    dispatch(resetUI())

    // Navigate to landing page
    navigate('/')
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

  // Format profession for display (convert snake_case to Title Case)
  const formatProfession = (profession: string) => {
    if (!profession) return 'Professional'
    return profession
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{playerName}</h1>
              <p className="text-sm text-gray-600">{formatProfession(player.profession)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewGameConfirm(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="New Game"
              >
                <LogOut className="h-5 w-5 text-gray-700" />
              </button>
              <div className="text-right">
                <p className="text-xs text-gray-500">Room Code</p>
                <p className="text-lg font-mono font-bold text-blue-600">{roomCode}</p>
              </div>
            </div>
          </div>

          {/* Passive Income vs Expenses Progress Bar */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Progress to Fast Track</span>
              <span className="text-xs text-gray-500">
                ${player.passiveIncome.toLocaleString()} / ${player.totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  player.passiveIncome >= player.totalExpenses ? 'bg-green-600' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, (player.passiveIncome / player.totalExpenses) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Action Buttons Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Row 1 */}
          <button
            onClick={() => navigate(`/game/${roomCode}/transaction/buy`)}
            disabled={hasPendingTransaction}
            className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Buy Asset
          </button>
          <button
            onClick={() => navigate(`/game/${roomCode}/transaction/sell`)}
            disabled={hasPendingTransaction}
            className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Sell Asset
          </button>
          <button
            onClick={() => navigate(`/game/${roomCode}/transaction/loan`)}
            disabled={hasPendingTransaction}
            className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Take Loan
          </button>

          {/* Row 2 */}
          <button
            onClick={() => navigate(`/game/${roomCode}/transaction/market`)}
            disabled={hasPendingTransaction}
            className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Market
          </button>
          <button
            onClick={() => navigate(`/game/${roomCode}/transaction/pay`)}
            disabled={hasPendingTransaction}
            className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Pay
          </button>
          <button
            onClick={() => navigate(`/game/${roomCode}/transaction/collect`)}
            disabled={hasPendingTransaction}
            className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Collect
          </button>
        </div>

        {/* Financial Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Financial Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Cash on Hand</span>
              <span className="text-sm font-bold text-gray-800">${player.cashOnHand.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Passive Income</span>
              <span className="text-sm font-bold text-purple-600">${player.passiveIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Expenses</span>
              <span className="text-sm font-bold text-red-600">${player.totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Income</span>
              <span className="text-sm font-bold text-green-600">${player.totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">PAYDAY</span>
              <span className={`text-sm font-bold ${player.paydayAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${player.paydayAmount.toLocaleString()}
              </span>
            </div>
          </div>
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

        {/* Pending Audits Alert */}
        {pendingAuditCount > 0 && (
          <div
            onClick={() => navigate(`/game/${roomCode}/audits`)}
            className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 cursor-pointer hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-900 font-medium">
                🔔 You have pending transaction{pendingAuditCount !== 1 ? 's' : ''} to review
              </p>
              <button className="text-amber-700 font-semibold text-sm underline">
                Review Now
              </button>
            </div>
          </div>
        )}

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

      {/* New Game Confirmation Modal */}
      {showNewGameConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Start New Game?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to start a new game? This will end your current session and you'll lose all your progress.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewGameConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNewGame}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardScreen