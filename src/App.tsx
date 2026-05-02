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
import { TransactionRejectedModal } from '@/components/TransactionRejectedModal'
import ReconnectionHandler from '@/components/ReconnectionHandler'
import { GameSocketProvider } from '@/components/GameSocketProvider'
import { NotificationToast } from '@/components/NotificationToast'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { closeModal, selectModalOpen } from '@/store/slices/uiSlice'
import {
  clearPendingTransaction,
  selectPendingTransaction,
} from '@/store/slices/transactionSlice'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'
import { MobileOptimizations } from '@/components/MobileOptimizations'

// Placeholder components for features not yet implemented

const NotFound = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-gray-600">Page not found</p>
    </div>
  </div>
)

// App content with all providers
const AppContent = () => {
  const modalOpen = useAppSelector(selectModalOpen)
  const pendingTransaction = useAppSelector(selectPendingTransaction)
  const dispatch = useAppDispatch()
  useKeyboardNavigation()

  // Closing the rejection modal also clears the pending-transaction record so
  // the FAB unlocks and the next attempt starts fresh. The "Edit Transaction"
  // button on the modal handles its own navigation; we just need to tear
  // down the modal state here.
  const handleRejectionClose = () => {
    dispatch(closeModal())
    dispatch(clearPendingTransaction())
  }

  return (
    <>
      {/* Optimization Providers */}
      <AccessibilityProvider />
      <MobileOptimizations />

      {/* Global UI Components */}
      <SessionExpiryWarning />
      <SessionExpiredModal isOpen={modalOpen === 'session_expired'} />
      <TransactionRejectedModal
        isOpen={modalOpen === 'transaction_rejected'}
        onClose={handleRejectionClose}
        rejectionNote={pendingTransaction?.auditorNote ?? ''}
        transactionType={pendingTransaction?.type ?? 'buy'}
        transactionData={
          pendingTransaction
            ? {
                subType: pendingTransaction.subType,
                details: pendingTransaction.details,
              }
            : undefined
        }
      />
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
            <ProtectedRoute redirectIfStarted>
              <GameSocketProvider>
                <GameLobbyScreen />
              </GameSocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.GAME_SETUP}
          element={
            <ProtectedRoute redirectIfSetupComplete>
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
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
