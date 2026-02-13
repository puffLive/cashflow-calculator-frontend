import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Users, ArrowRight } from 'lucide-react'

const LandingScreen = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateGame = () => {
    setIsLoading(true)
    navigate('/create')
  }

  const handleJoinGame = () => {
    setIsLoading(true)
    navigate('/join')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Cashflow Calculator
          </h1>
          <p className="text-gray-600 text-lg">
            Escape the Rat Race and achieve financial freedom!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">
              Ready to Play?
            </h2>
            <p className="text-gray-500 mt-2">
              Create a new game or join an existing session
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateGame}
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-3 py-4 text-lg"
            >
              <Home className="w-6 h-6" />
              <span>Create New Game</span>
              <ArrowRight className="w-5 h-5 ml-auto" />
            </button>

            <button
              onClick={handleJoinGame}
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-3 py-4 text-lg"
            >
              <Users className="w-6 h-6" />
              <span>Join Existing Game</span>
              <ArrowRight className="w-5 h-5 ml-auto" />
            </button>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Up to 6 players per game session
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Based on Robert Kiyosaki's Cashflow Board Game
          </p>
        </div>
      </div>
    </div>
  )
}

export default LandingScreen