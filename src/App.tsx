import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

// Import screens
import LandingScreen from '@/screens/LandingScreen'
import CreateGameScreen from '@/screens/CreateGameScreen'
import JoinGameScreen from '@/screens/JoinGameScreen'
import GameLobbyScreen from '@/screens/GameLobbyScreen'
import PlayerSetupScreen from '@/screens/PlayerSetupScreen'
import DashboardScreen from '@/screens/DashboardScreen'
import BuyTransactionScreen from '@/screens/BuyTransactionScreen'
import SellTransactionScreen from '@/screens/SellTransactionScreen'
import TakeLoanScreen from '@/screens/TakeLoanScreen'
import PayOffLoanScreen from '@/screens/PayOffLoanScreen'
import MarketEventScreen from '@/screens/MarketEventScreen'
import CollectScreen from '@/screens/CollectScreen'
import PayTransactionScreen from '@/screens/PayTransactionScreen'
import PendingAuditsScreen from '@/screens/PendingAuditsScreen'
import AuditReviewScreen from '@/screens/AuditReviewScreen'
import HandoffAuditScreen from '@/screens/HandoffAuditScreen'
import PlayersOverviewScreen from '@/screens/PlayersOverviewScreen'
import TransactionHistoryScreen from '@/screens/TransactionHistoryScreen'
import IncomeDetailScreen from '@/screens/IncomeDetailScreen'
import ExpenseDetailScreen from '@/screens/ExpenseDetailScreen'
import AssetDetailScreen from '@/screens/AssetDetailScreen'
import LiabilityDetailScreen from '@/screens/LiabilityDetailScreen'

// Import global components
import SessionExpiryWarning from '@/components/SessionExpiryWarning'
import SessionExpiredModal from '@/components/SessionExpiredModal'
import ReconnectionHandler from '@/components/ReconnectionHandler'
import { GameSocketProvider } from '@/components/GameSocketProvider'
import { NotificationToast } from '@/components/NotificationToast'
import { useAppSelector } from '@/hooks/redux'
import { selectModalOpen } from '@/store/slices/uiSlice'

// Placeholder components for features not yet implemented

const NotFound = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-gray-600">Page not found</p>
    </div>
  </div>
)

function App() {
  const modalOpen = useAppSelector(selectModalOpen)

  return (
    <Router>
      {/* Global UI Components */}
      <SessionExpiryWarning />
      <SessionExpiredModal isOpen={modalOpen === 'session_expired'} />
      <ReconnectionHandler />
      <NotificationToast />

      <Routes>
        {/* Landing and game creation */}
        <Route path={ROUTES.LANDING} element={<LandingScreen />} />
        <Route path="/create" element={<CreateGameScreen />} />
        <Route path="/join" element={<JoinGameScreen />} />

        {/* Game routes - all wrapped with GameSocketProvider for socket connection */}
        <Route path={ROUTES.GAME_LOBBY} element={<GameSocketProvider><GameLobbyScreen /></GameSocketProvider>} />
        <Route path={ROUTES.GAME_SETUP} element={<GameSocketProvider><PlayerSetupScreen /></GameSocketProvider>} />
        <Route path={ROUTES.GAME_DASHBOARD} element={<GameSocketProvider><DashboardScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/players" element={<GameSocketProvider><PlayersOverviewScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/history" element={<GameSocketProvider><TransactionHistoryScreen /></GameSocketProvider>} />

        {/* Detail screens */}
        <Route path="/game/:roomCode/income" element={<GameSocketProvider><IncomeDetailScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/expenses" element={<GameSocketProvider><ExpenseDetailScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/assets" element={<GameSocketProvider><AssetDetailScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/liabilities" element={<GameSocketProvider><LiabilityDetailScreen /></GameSocketProvider>} />

        {/* Transaction routes */}
        <Route path="/game/:roomCode/transaction/buy" element={<GameSocketProvider><BuyTransactionScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/transaction/sell" element={<GameSocketProvider><SellTransactionScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/transaction/loan" element={<GameSocketProvider><TakeLoanScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/transaction/payoff" element={<GameSocketProvider><PayOffLoanScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/transaction/market" element={<GameSocketProvider><MarketEventScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/transaction/collect" element={<GameSocketProvider><CollectScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/transaction/pay" element={<GameSocketProvider><PayTransactionScreen /></GameSocketProvider>} />

        {/* Audit routes */}
        <Route path="/game/:roomCode/audits" element={<GameSocketProvider><PendingAuditsScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/audit/:transactionId" element={<GameSocketProvider><AuditReviewScreen /></GameSocketProvider>} />
        <Route path="/game/:roomCode/audit/handoff" element={<GameSocketProvider><HandoffAuditScreen /></GameSocketProvider>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App