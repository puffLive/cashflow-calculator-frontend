import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'
import { useSetupPlayerMutation } from '@/services/gameApi'
import { PROFESSIONS } from '@/constants/professions'
import FinancialSheetPreview from '@/components/FinancialSheetPreview'
import type { Profession } from '@/types/profession'

const PlayerSetupScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const [randomProfession, setRandomProfession] = useState<Profession | null>(null)

  const [setupPlayer, { isLoading, error }] = useSetupPlayerMutation()

  // Get player data from session storage
  const playerId = sessionStorage.getItem('playerId')
  const playerName = sessionStorage.getItem('playerName')

  useEffect(() => {
    if (!playerId || !playerName || !roomCode) {
      navigate('/')
    }
  }, [playerId, playerName, roomCode, navigate])

  // Randomly assign a profession on mount
  useEffect(() => {
    if (PROFESSIONS.length > 0 && !randomProfession) {
      const randomIndex = Math.floor(Math.random() * PROFESSIONS.length)
      setRandomProfession(PROFESSIONS[randomIndex])
    }
  }, [randomProfession])

  const handleRandomize = () => {
    const randomIndex = Math.floor(Math.random() * PROFESSIONS.length)
    setRandomProfession(PROFESSIONS[randomIndex])
  }

  const handleConfirm = async () => {
    if (!randomProfession || !playerId || !roomCode) return

    try {
      await setupPlayer({
        roomCode,
        playerId,
        profession: randomProfession.id,
        dream: '', // Will be set later in the game
        auditorPlayerId: '' // Will be assigned when game starts
      }).unwrap()

      // Navigate back to lobby after successful setup
      navigate(`/game/${roomCode}/lobby`)
    } catch (err) {
      console.error('Failed to setup player:', err)
    }
  }

  const handleBack = () => {
    navigate(`/game/${roomCode}/lobby`)
  }

  if (!randomProfession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Assigning profession...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Lobby</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">Your Profession</h1>
              <p className="text-sm text-gray-600">{playerName}</p>
            </div>
            <div className="w-24" /> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profession Assignment Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              You have been assigned:
            </h2>
            <div className="inline-block">
              <div className={`px-4 py-2 rounded-full text-sm font-medium mb-2 ${
                randomProfession.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                randomProfession.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {randomProfession.difficulty.charAt(0).toUpperCase() + randomProfession.difficulty.slice(1)} Difficulty
              </div>
            </div>
            <h3 className="text-3xl font-bold text-blue-600 mb-4">
              {randomProfession.title}
            </h3>
            <p className="text-gray-600 mb-4">{randomProfession.description}</p>

            <button
              onClick={handleRandomize}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Another Profession</span>
            </button>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 font-medium mb-1">Monthly Salary</p>
              <p className="text-2xl font-bold text-blue-700">
                ${randomProfession.salary.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600 font-medium mb-1">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-700">
                ${(randomProfession.taxes + randomProfession.mortgage + randomProfession.schoolLoan + randomProfession.carLoan + randomProfession.creditCard + randomProfession.otherExpenses + randomProfession.bankLoan).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 font-medium mb-1">Monthly Cashflow</p>
              <p className="text-2xl font-bold text-green-700">
                ${(randomProfession.salary - (randomProfession.taxes + randomProfession.mortgage + randomProfession.schoolLoan + randomProfession.carLoan + randomProfession.creditCard + randomProfession.otherExpenses + randomProfession.bankLoan)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Note about children */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You start with 0 children. Children can be added during the game when you draw a "Baby" card.
              Each child adds ${randomProfession.perChildExpense.toLocaleString()}/month in expenses.
            </p>
          </div>
        </div>

        {/* Financial Sheet Preview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Your Starting Financial Sheet</h3>
          <FinancialSheetPreview
            profession={randomProfession}
          />
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isLoading ? 'Setting up...' : 'Confirm & Continue'}</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-center">
              Failed to setup player. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerSetupScreen
