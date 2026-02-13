import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Share2, Check } from 'lucide-react'
import { useCreateGameMutation } from '@/services/gameApi'
import { useAppDispatch } from '@/hooks/redux'
import { setGameSession } from '@/store/slices/gameSessionSlice'
import { setPlayerData } from '@/store/slices/playerSlice'
import { addNotification } from '@/store/slices/uiSlice'
import { buildRoute, ROUTES } from '@/constants/routes'

const CreateGameScreen = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [createGame, { isLoading: isCreating }] = useCreateGameMutation()

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Please enter your name',
        duration: 3000
      }))
      return
    }

    try {
      // Create the game
      const createResult = await createGame({
        gameVersion: 'cashflow_101',
        hostName: playerName.trim()
      }).unwrap()
      const newRoomCode = createResult.roomCode
      const hostPlayerId = createResult.hostPlayerId

      // Update Redux state
      dispatch(setGameSession({
        roomCode: newRoomCode,
        status: 'waiting',
        hostPlayerId: hostPlayerId,
        currentPlayerId: hostPlayerId,
        playerCount: 1,
        maxPlayers: 6,
        gameVersion: 'cashflow_101'
      }))

      dispatch(setPlayerData({
        id: hostPlayerId,
        name: playerName.trim(),
        isReady: false
      }))

      setRoomCode(newRoomCode)

      // Store in session storage for reconnection
      sessionStorage.setItem('roomCode', newRoomCode)
      sessionStorage.setItem('playerId', hostPlayerId)
      sessionStorage.setItem('playerName', playerName.trim())

    } catch (error) {
      console.error('Failed to create game:', error)
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to create game. Please try again.',
        duration: 5000
      }))
    }
  }

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Room code copied to clipboard!',
        duration: 2000
      }))
    }
  }

  const handleShare = async () => {
    if (roomCode && navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Cashflow game!',
          text: `Join my Cashflow game with room code: ${roomCode}`,
          url: window.location.origin + `/join?code=${roomCode}`
        })
      } catch (error) {
        // User cancelled share or share failed
        console.log('Share cancelled or failed')
      }
    }
  }

  const handleContinueToLobby = () => {
    if (roomCode) {
      navigate(buildRoute(ROUTES.GAME_LOBBY, { roomCode }))
    }
  }

  if (roomCode) {
    // Show room code screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Game Created Successfully!
              </h2>
              <p className="text-gray-600">
                Share this code with your friends
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-500 mb-2 text-center">Room Code</p>
              <p className="text-4xl font-mono font-bold text-center text-gray-800">
                {roomCode}
              </p>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={handleCopyCode}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>

              {navigator.share !== undefined && (
                <button
                  onClick={handleShare}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              )}
            </div>

            <button
              onClick={handleContinueToLobby}
              className="w-full btn-success py-3 text-lg font-semibold"
            >
              Continue to Lobby
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Waiting for players to join...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Create New Game
          </h2>

          <form onSubmit={(e) => { e.preventDefault(); handleCreateGame() }} className="space-y-6">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="input-field"
                maxLength={20}
                required
                autoFocus
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Game Version:</span> Cashflow 101
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Classic version with standard professions and assets
              </p>
            </div>

            <button
              type="submit"
              disabled={isCreating || !playerName.trim()}
              className="w-full btn-success py-3 text-lg font-semibold"
            >
              {isCreating ? 'Creating Game...' : 'Create Game'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              You will be the host of this game session
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateGameScreen