import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

// Import screens
import LandingScreen from '@/screens/LandingScreen'
import CreateGameScreen from '@/screens/CreateGameScreen'
import JoinGameScreen from '@/screens/JoinGameScreen'
import GameLobbyScreen from '@/screens/GameLobbyScreen'

// Placeholder components for features not yet implemented
const PlayerSetupScreen = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Player Setup</h1>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  </div>
)

const DashboardScreen = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Game Dashboard</h1>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  </div>
)

const NotFound = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-gray-600">Page not found</p>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing and game creation */}
        <Route path={ROUTES.LANDING} element={<LandingScreen />} />
        <Route path="/create" element={<CreateGameScreen />} />
        <Route path="/join" element={<JoinGameScreen />} />

        {/* Game routes */}
        <Route path={ROUTES.GAME_LOBBY} element={<GameLobbyScreen />} />
        <Route path={ROUTES.GAME_SETUP} element={<PlayerSetupScreen />} />
        <Route path={ROUTES.GAME_DASHBOARD} element={<DashboardScreen />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App