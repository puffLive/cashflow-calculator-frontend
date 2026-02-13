import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useSetupPlayerMutation } from '@/services/gameApi'
import { PROFESSIONS } from '@/constants/professions'
import ProfessionCard from '@/components/ProfessionCard'
import FinancialSheetPreview from '@/components/FinancialSheetPreview'
import type { Profession } from '@/types/profession'

const PlayerSetupScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null)
  const [numberOfChildren, setNumberOfChildren] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  const [setupPlayer, { isLoading, error }] = useSetupPlayerMutation()

  // Get player data from session storage
  const playerId = sessionStorage.getItem('playerId')
  const playerName = sessionStorage.getItem('playerName')

  useEffect(() => {
    if (!playerId || !playerName || !roomCode) {
      navigate('/')
    }
  }, [playerId, playerName, roomCode, navigate])

  const handleProfessionSelect = (profession: Profession) => {
    setSelectedProfession(profession)
    setShowPreview(false)
  }

  const handlePreview = () => {
    if (selectedProfession) {
      setShowPreview(true)
    }
  }

  const handleConfirm = async () => {
    if (!selectedProfession || !playerId || !roomCode) return

    try {
      await setupPlayer({
        roomCode,
        playerId,
        profession: selectedProfession.id,
        dream: '', // Will be set later in the game
        auditorPlayerId: '' // Will be assigned when game starts
      }).unwrap()

      // Navigate to dashboard after successful setup
      navigate(`/game/${roomCode}/dashboard`)
    } catch (err) {
      console.error('Failed to setup player:', err)
    }
  }

  const handleBack = () => {
    navigate(`/game/${roomCode}/lobby`)
  }

  // Filter professions by difficulty for better organization
  const easyProfessions = PROFESSIONS.filter(p => p.difficulty === 'easy')
  const mediumProfessions = PROFESSIONS.filter(p => p.difficulty === 'medium')
  const hardProfessions = PROFESSIONS.filter(p => p.difficulty === 'hard')

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
              <h1 className="text-2xl font-bold text-gray-800">Choose Your Profession</h1>
              <p className="text-sm text-gray-600">{playerName}</p>
            </div>
            <div className="w-24" /> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!showPreview ? (
          <>
            {/* Children Selection */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Children (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setNumberOfChildren(Math.max(0, numberOfChildren - 1))}
                  className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-bold"
                  disabled={numberOfChildren === 0}
                >
                  -
                </button>
                <span className="text-2xl font-bold text-gray-800 w-12 text-center">
                  {numberOfChildren}
                </span>
                <button
                  onClick={() => setNumberOfChildren(Math.min(6, numberOfChildren + 1))}
                  className="w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold"
                  disabled={numberOfChildren === 6}
                >
                  +
                </button>
                <span className="text-sm text-gray-600">
                  (Each child adds ${selectedProfession?.perChildExpense.toLocaleString() || 0}/month expenses)
                </span>
              </div>
            </div>

            {/* Easy Professions */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Easy
                </span>
                <h2 className="text-xl font-semibold text-gray-800">Beginner Friendly</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {easyProfessions.map(profession => (
                  <ProfessionCard
                    key={profession.id}
                    profession={profession}
                    isSelected={selectedProfession?.id === profession.id}
                    onSelect={() => handleProfessionSelect(profession)}
                  />
                ))}
              </div>
            </div>

            {/* Medium Professions */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  Medium
                </span>
                <h2 className="text-xl font-semibold text-gray-800">Moderate Challenge</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediumProfessions.map(profession => (
                  <ProfessionCard
                    key={profession.id}
                    profession={profession}
                    isSelected={selectedProfession?.id === profession.id}
                    onSelect={() => handleProfessionSelect(profession)}
                  />
                ))}
              </div>
            </div>

            {/* Hard Professions */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  Hard
                </span>
                <h2 className="text-xl font-semibold text-gray-800">Expert Level</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hardProfessions.map(profession => (
                  <ProfessionCard
                    key={profession.id}
                    profession={profession}
                    isSelected={selectedProfession?.id === profession.id}
                    onSelect={() => handleProfessionSelect(profession)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Financial Preview */
          <div className="max-w-2xl mx-auto">
            {selectedProfession && <FinancialSheetPreview profession={selectedProfession} />}

            {numberOfChildren > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">With {numberOfChildren} {numberOfChildren === 1 ? 'child' : 'children'}:</span>
                  {' '}Additional ${(selectedProfession!.perChildExpense * numberOfChildren).toLocaleString()}/month in expenses
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                Failed to set up profession. Please try again.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-left">
              {selectedProfession && (
                <>
                  <p className="text-sm text-gray-600">Selected Profession</p>
                  <p className="font-semibold text-gray-800">{selectedProfession.title}</p>
                </>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {!showPreview ? (
                <button
                  onClick={handlePreview}
                  disabled={!selectedProfession}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Preview Financial Sheet
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Choose Different
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{isLoading ? 'Setting up...' : 'Confirm & Continue'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerSetupScreen