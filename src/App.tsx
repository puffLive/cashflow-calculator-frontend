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
import { ProtectedRoute } from '@/components/ProtectedRoute'
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

        {/* Game routes - all wrapped with ProtectedRoute and GameSocketProvider */}
        <Route
          path={ROUTES.GAME_LOBBY}
          element={
            <ProtectedRoute>
              <GameSocketProvider>
                <GameLobbyScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.GAME_SETUP}
          element={
            <ProtectedRoute>
              <GameSocketProvider>
                <PlayerSetupScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.GAME_DASHBOARD}
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <DashboardScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/players"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <PlayersOverviewScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/history"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <TransactionHistoryScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />

        {/* Detail screens */}
        <Route
          path="/game/:roomCode/income"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <IncomeDetailScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/expenses"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <ExpenseDetailScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/assets"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <AssetDetailScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/liabilities"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <LiabilityDetailScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />

        {/* Transaction routes */}
        <Route
          path="/game/:roomCode/transaction/buy"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <BuyTransactionScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/transaction/sell"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <SellTransactionScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/transaction/loan"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <TakeLoanScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/transaction/payoff"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <PayOffLoanScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/transaction/market"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <MarketEventScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/transaction/collect"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <CollectScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/transaction/pay"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <PayTransactionScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />

        {/* Audit routes */}
        <Route
          path="/game/:roomCode/audits"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <PendingAuditsScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/audit/:transactionId"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <AuditReviewScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:roomCode/audit/handoff"
          element={
            <ProtectedRoute requireSetup>
              <GameSocketProvider>
                <HandoffAuditScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
