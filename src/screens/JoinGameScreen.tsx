import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Users, AlertCircle } from 'lucide-react'
import { useJoinGameMutation } from '@/services/gameApi'
import { useAppDispatch } from '@/hooks/redux'
import { setGameSession } from '@/store/slices/gameSessionSlice'
import { setPlayerData } from '@/store/slices/playerSlice'
import { addNotification } from '@/store/slices/uiSlice'
import { buildRoute, ROUTES } from '@/constants/routes'

const JoinGameScreen = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()

  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const [joinGame, { isLoading: isJoining }] = useJoinGameMutation()

  // Pre-fill room code from URL if provided
  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase())
    }
  }, [searchParams])

  // Validate room code format
  const validateRoomCode = (code: string) => {
    const uppercaseCode = code.toUpperCase()
    setRoomCode(uppercaseCode)

    if (uppercaseCode.length === 6) {
      setValidatingCode(true)
      setCodeError(null)
      // Could add additional validation here
      setValidatingCode(false)
    } else {
      setCodeError(null)
    }
  }

  const handleJoinGame = async () => {
    if (!roomCode || roomCode.length !== 6) {
      setCodeError('Room code must be 6 characters')
      return
    }

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
      const result = await joinGame({
        roomCode: roomCode.toUpperCase(),
        playerName: playerName.trim()
      }).unwrap()

      // Update Redux state
      dispatch(setGameSession({
        roomCode: roomCode.toUpperCase(),
        status: result.gameSession.status,
        hostPlayerId: result.gameSession.hostPlayerId,
        currentPlayerId: result.playerId,
        playerCount: result.gameSession.playerCount,
        maxPlayers: result.gameSession.maxPlayers,
        gameVersion: 'cashflow101'
      }))

      dispatch(setPlayerData({
        id: result.playerId,
        name: playerName.trim(),
        isReady: false
      }))

      // Store in session storage for reconnection
      sessionStorage.setItem('roomCode', roomCode.toUpperCase())
      sessionStorage.setItem('playerId', result.playerId)
      sessionStorage.setItem('playerName', playerName.trim())

      // Navigate to lobby
      navigate(buildRoute(ROUTES.GAME_LOBBY, { roomCode: roomCode.toUpperCase() }))

      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Successfully joined the game!',
        duration: 3000
      }))

    } catch (error: any) {
      console.error('Failed to join game:', error)

      // Handle specific error cases
      let errorMessage = 'Failed to join game'
      if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (error?.status === 404) {
        errorMessage = 'Room not found. Please check the code.'
      } else if (error?.data?.error?.includes('already started')) {
        errorMessage = 'This game has already started'
      } else if (error?.data?.error?.includes('full')) {
        errorMessage = 'This game is full (6/6 players)'
      } else if (error?.data?.error?.includes('expired')) {
        errorMessage = 'This room code has expired'
      }

      setCodeError(errorMessage)
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: errorMessage,
        duration: 5000
      }))
    }
  }

  const isLoading = isJoining || validatingCode

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
          <div className="flex items-center mb-6">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">
              Join Existing Game
            </h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleJoinGame() }} className="space-y-6">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => validateRoomCode(e.target.value.slice(0, 6))}
                placeholder="Enter 6-character code"
                className={`input-field font-mono text-center text-2xl tracking-wider ${
                  codeError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                maxLength={6}
                required
                autoFocus
                autoComplete="off"
                style={{ textTransform: 'uppercase' }}
              />
              {codeError && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {codeError}
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Get this code from the game host
              </p>
            </div>

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
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || roomCode.length !== 6 || !playerName.trim()}
              className="w-full btn-primary py-3 text-lg font-semibold"
            >
              {isLoading ? 'Joining Game...' : 'Join Game'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-2 text-sm text-gray-500">
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Room codes are case-insensitive
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Games can have up to 6 players
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                You can rejoin if disconnected
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinGameScreen