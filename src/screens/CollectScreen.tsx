import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, DollarSign, Banknote, User } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { useCollectPaydayMutation, useSubmitMarketEventMutation } from '@/services/gameApi'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import { selectHasPendingTransaction } from '@/store/slices/transactionSlice'
import { selectAllPlayers } from '@/store/slices/allPlayersSlice'
import { addNotification } from '@/store/slices/uiSlice'
import TransactionImpactPreview from '@/components/TransactionImpactPreview'
import AssetTypeCard from '@/components/AssetTypeCard'

type CollectType = 'payday' | 'money'

interface CollectTypeInfo {
  id: CollectType
  title: string
  description: string
  icon: typeof DollarSign
}

const CollectScreen = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { roomCode } = useParams<{ roomCode: string }>()
  const player = useAppSelector(selectCurrentPlayer)
  const allPlayers = useAppSelector(selectAllPlayers)
  const hasPendingTransaction = useAppSelector(selectHasPendingTransaction)

  const [collectPayday, { isLoading: isCollectingPayday }] = useCollectPaydayMutation()
  const [submitMarketEvent, { isLoading: isSubmittingMarketEvent }] = useSubmitMarketEventMutation()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = useState<CollectType | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [amount, setAmount] = useState(0)

  // Filter out current player from selection
  const otherPlayers = allPlayers.filter(p => p.id !== player.id && p.connectionStatus === 'connected')

  const collectTypes: CollectTypeInfo[] = [
    { id: 'payday', title: 'Collect PAYDAY', description: 'Collect your monthly PAYDAY', icon: DollarSign },
    { id: 'money', title: 'Collect Money', description: 'Receive payment from another player', icon: Banknote }
  ]

  const handleTypeSelect = (typeId: CollectType) => {
    setSelectedType(typeId)
  }

  const handleNext = () => {
    if (step === 1 && selectedType === 'money') {
      setStep(2) // Go to player selection
    } else if (step === 1 && selectedType === 'payday') {
      setStep(3) // Skip player selection for payday
    } else if (step === 2) {
      setStep(3) // Go to amount/review
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3)
      if (step === 2) {
        setSelectedPlayerId(null)
      }
      if (step === 1) {
        setAmount(0)
      }
    } else {
      navigate(`/game/${roomCode}/dashboard`)
    }
  }

  const calculateImpact = () => {
    const cashBefore = player.cashOnHand
    let cashAfter = cashBefore

    if (selectedType === 'payday') {
      cashAfter = cashBefore + player.paydayAmount
    } else if (selectedType === 'money') {
      cashAfter = cashBefore + amount
    }

    return {
      cashOnHand: { before: cashBefore, after: cashAfter }
    }
  }

  const getCollectDetails = (): string => {
    if (selectedType === 'payday') {
      return `Collecting PAYDAY: $${player.paydayAmount.toLocaleString()}`
    } else if (selectedType === 'money' && selectedPlayerId) {
      const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId)
      return `Collecting $${amount.toLocaleString()} from ${selectedPlayer?.name || 'player'}`
    }
    return ''
  }

  const handleSubmit = async () => {
    if (!roomCode || !selectedType) return

    const playerId = sessionStorage.getItem('playerId')
    if (!playerId) return

    try {
      if (selectedType === 'payday') {
        // Directly collect payday
        await collectPayday({ roomCode, playerId }).unwrap()
        dispatch(addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: `Collected PAYDAY: $${player.paydayAmount.toLocaleString()}`,
          duration: 3000
        }))
        navigate(`/game/${roomCode}/dashboard`)
      } else if (selectedType === 'money') {
        // Submit market event for collecting money (uses lend_collect with positive amount)
        const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId)
        await submitMarketEvent({
          roomCode,
          playerId,
          subType: 'lend_collect',
          amount: amount,  // Positive for collect, negative for lend
          fromPlayerId: selectedPlayerId || undefined,  // The player being asked to pay
          fromPlayerName: selectedPlayer?.name
        }).unwrap()
        dispatch(addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: `Collection request sent to ${selectedPlayer?.name}`,
          duration: 3000
        }))
        navigate(`/game/${roomCode}/dashboard`)
      }
    } catch (err: any) {
      console.error('Failed to collect:', err)

      // Handle specific error cases
      if (err?.status === 409) {
        dispatch(addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: 'You have a pending transaction. Please wait for audit approval.',
          duration: 5000
        }))
      } else if (err?.data?.message) {
        dispatch(addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: err.data.message,
          duration: 5000
        }))
      } else {
        dispatch(addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to collect. Please try again.',
          duration: 5000
        }))
      }
    }
  }

  const getTotalSteps = () => {
    return selectedType === 'payday' ? 2 : 3
  }

  const isLoading = isCollectingPayday || isSubmittingMarketEvent

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Collect</h1>
            <div className="text-sm text-gray-500">Step {step}/{getTotalSteps()}</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Pending Transaction Warning */}
        {hasPendingTransaction && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ You have a pending transaction. You cannot collect PAYDAY until it's reviewed by your auditor.
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              You can still collect money from other players.
            </p>
          </div>
        )}

        {/* Step 1: Collection Type Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Collection Type</h2>
              <p className="text-gray-600">Choose what you want to collect</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collectTypes.map((type) => (
                <AssetTypeCard
                  key={type.id}
                  id={type.id}
                  title={type.title}
                  description={type.description}
                  icon={type.icon}
                  isSelected={selectedType === type.id}
                  onSelect={() => handleTypeSelect(type.id)}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedType}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Player Selection (only for "money" type) */}
        {step === 2 && selectedType === 'money' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Player</h2>
              <p className="text-gray-600">Who are you collecting money from?</p>
            </div>

            {otherPlayers.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 font-medium">No other players are connected</p>
                <p className="text-sm text-yellow-700 mt-1">Wait for other players to join the game</p>
              </div>
            ) : (
              <div className="space-y-3">
                {otherPlayers.map((otherPlayer) => (
                  <button
                    key={otherPlayer.id}
                    onClick={() => setSelectedPlayerId(otherPlayer.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedPlayerId === otherPlayer.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedPlayerId === otherPlayer.id ? 'bg-blue-500' : 'bg-gray-200'
                        }`}>
                          <User className={`w-6 h-6 ${
                            selectedPlayerId === otherPlayer.id ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-800">{otherPlayer.name}</p>
                          <p className="text-sm text-gray-600">{otherPlayer.profession || 'No profession'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Cash on Hand</p>
                        <p className="font-semibold text-gray-800">${otherPlayer.cashOnHand.toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedPlayerId}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Collection Details */}
        {step === 3 && selectedType && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {collectTypes.find(t => t.id === selectedType)?.title}
              </h2>
              <p className="text-gray-600">{collectTypes.find(t => t.id === selectedType)?.description}</p>
            </div>

            {/* Collect PAYDAY */}
            {selectedType === 'payday' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Ready to collect your PAYDAY!</h3>
                  <p className="text-sm text-green-700">Your monthly cashflow will be added to your cash on hand.</p>
                </div>

                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium text-gray-700">PAYDAY Amount:</span>
                  <span className="text-2xl font-bold text-green-600">${player.paydayAmount.toLocaleString()}</span>
                </div>

                {hasPendingTransaction && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ You have a pending transaction. You cannot collect PAYDAY until your auditor reviews it.
                    </p>
                  </div>
                )}

                {player.paydayAmount <= 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Your PAYDAY is $0 or negative. You cannot collect PAYDAY at this time.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Current Cash:</span>
                    <span className="font-medium text-blue-800">${player.cashOnHand.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">After Collection:</span>
                    <span className="font-medium text-blue-800">${(player.cashOnHand + player.paydayAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Collect Money */}
            {selectedType === 'money' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Collect Money from {allPlayers.find(p => p.id === selectedPlayerId)?.name}</h3>
                  <p className="text-sm text-blue-700">Enter the amount you're receiving. The selected player will be notified to confirm this payment.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Collect *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Cash Impact:</span>
                    <span className="font-medium text-green-800">+${amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">New Cash on Hand:</span>
                    <span className="font-medium text-green-800">${(player.cashOnHand + amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Impact Preview */}
            <TransactionImpactPreview
              impact={calculateImpact()}
              assetDetails={getCollectDetails()}
            />

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                {selectedType === 'payday' ? 'Change Type' : 'Back'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  (selectedType === 'payday' && (player.paydayAmount <= 0 || hasPendingTransaction)) ||
                  (selectedType === 'money' && (amount <= 0 || !selectedPlayerId))
                }
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : selectedType === 'payday' ? 'Collect PAYDAY' : 'Send Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CollectScreen
