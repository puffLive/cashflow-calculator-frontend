import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

// Placeholder components - will be implemented in next sprint
const LandingPage = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Cashflow Calculator</h1>
      <div className="space-y-4">
        <button className="btn-primary w-64">Create New Game</button>
        <br />
        <button className="btn-primary w-64">Join Existing Game</button>
      </div>
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
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App