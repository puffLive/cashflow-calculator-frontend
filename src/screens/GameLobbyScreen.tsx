import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Copy, Check, Share2, Users, Crown, Clock, Settings } from 'lucide-react'
import { useGetGameSessionQuery, useStartGameMutation, useGetAllPlayersQuery } from '@/services/gameApi'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { useSocketEvents } from '@/hooks/useSocketEvents'
import { selectCurrentPlayerId, selectIsHost } from '@/store/slices/gameSessionSlice'
import { selectAllPlayers } from '@/store/slices/allPlayersSlice'
import { addNotification } from '@/store/slices/uiSlice'
import { buildRoute, ROUTES } from '@/constants/routes'

interface PlayerListItemProps {
  player: {
    id: string
    name: string
    profession?: string
    isHost: boolean
    isReady: boolean
    connectionStatus: 'connected' | 'disconnected' | 'removed'
  }
  isCurrentPlayer: boolean
}

const PlayerListItem = ({ player, isCurrentPlayer }: PlayerListItemProps) => {
  const getStatusColor = () => {
    if (player.connectionStatus === 'disconnected') return 'bg-yellow-500'
    if (player.connectionStatus === 'removed') return 'bg-gray-400'
    if (player.isReady) return 'bg-green-500'
    return 'bg-orange-500'
  }

  const getStatusText = () => {
    if (player.connectionStatus === 'disconnected') return 'Disconnected'
    if (player.connectionStatus === 'removed') return 'Removed'
    if (player.isReady) return 'Ready'
    return 'Setting up...'
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg ${
      isCurrentPlayer ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
          player.isHost ? 'bg-yellow-500' : 'bg-gray-400'
        }`}>
          {player.isHost ? <Crown className="w-5 h-5" /> : (player.name?.[0]?.toUpperCase() || '?')}
        </div>
        <div>
          <p className="font-semibold text-gray-800">
            {player.name}
            {isCurrentPlayer && <span className="ml-2 text-sm text-blue-600">(You)</span>}
            {player.isHost && <span className="ml-2 text-sm text-yellow-600">(Host)</span>}
          </p>
          <p className="text-sm text-gray-500">
            {player.profession || 'No profession selected'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
        <span className="text-sm text-gray-600">{getStatusText()}</span>
      </div>
    </div>
  )
}

const GameLobbyScreen = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { roomCode } = useParams<{ roomCode: string }>()
  const [copied, setCopied] = useState(false)

  const currentPlayerId = useAppSelector(selectCurrentPlayerId)
  const isHost = useAppSelector(selectIsHost)
  const players = useAppSelector(selectAllPlayers)

  // RTK Query hooks
  const { data: gameSession, isLoading: isLoadingSession } = useGetGameSessionQuery(
    roomCode || '',
    { skip: !roomCode, pollingInterval: 5000 }
  )

  const { isLoading: isLoadingPlayers } = useGetAllPlayersQuery(
    roomCode || '',
    { skip: !roomCode, pollingInterval: 3000 }
  )

  const [startGame, { isLoading: isStarting }] = useStartGameMutation()

  // Socket.io connection
  const { isConnected } = useSocketEvents(roomCode || null)

  // Check if current player has completed setup
  const currentPlayer = players.find(p => p.id === currentPlayerId)
  const isReady = currentPlayer?.isReady || false
  const allPlayersReady = players.length > 0 && players.every(p => p.isReady)

  // Handle game started event
  useEffect(() => {
    if (gameSession?.status === 'active') {
      navigate(buildRoute(ROUTES.GAME_DASHBOARD, { roomCode: roomCode || '' }))
    }
  }, [gameSession?.status, navigate, roomCode])

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Room code copied!',
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
        console.log('Share cancelled or failed')
      }
    }
  }

  const handleSetupPlayer = () => {
    navigate(buildRoute(ROUTES.GAME_SETUP, { roomCode: roomCode || '' }))
  }

  const handleStartGame = async () => {
    if (!roomCode || !isHost || !allPlayersReady) return

    try {
      await startGame(roomCode).unwrap()
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Game started!',
        duration: 3000
      }))
    } catch (error) {
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to start game. Please try again.',
        duration: 5000
      }))
    }
  }

  const isLoading = isLoadingSession || isLoadingPlayers

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Game Lobby</h1>
              <p className="text-gray-600">Waiting for all players to be ready...</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Room Code Section */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Room Code</p>
              <p className="text-2xl font-mono font-bold text-gray-800">{roomCode}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="btn-primary px-3 py-2 flex items-center space-x-2"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              {navigator.share !== undefined && (
                <button
                  onClick={handleShare}
                  className="btn-primary px-3 py-2 flex items-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Players ({players.length}/6)
              </h2>
            </div>
            <div className="text-sm text-gray-500">
              {6 - players.length} slots available
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading players...
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No players yet. Share the room code to invite friends!
              </div>
            ) : (
              players.map(player => (
                <PlayerListItem
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === currentPlayerId}
                />
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {!isReady ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                You need to set up your player before the game can start
              </p>
              <button
                onClick={handleSetupPlayer}
                className="btn-primary px-6 py-3 text-lg font-semibold flex items-center mx-auto space-x-2"
              >
                <Settings className="w-5 h-5" />
                <span>Set Up Your Player</span>
              </button>
            </div>
          ) : isHost ? (
            <div className="text-center">
              {allPlayersReady ? (
                <>
                  <p className="text-green-600 font-semibold mb-4">
                    All players are ready! You can start the game now.
                  </p>
                  <button
                    onClick={handleStartGame}
                    disabled={isStarting}
                    className="btn-success px-8 py-3 text-lg font-bold mx-auto"
                  >
                    {isStarting ? 'Starting Game...' : 'Start Game'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    Waiting for all players to complete setup...
                  </p>
                  <button
                    disabled
                    className="btn-primary px-8 py-3 text-lg font-bold mx-auto opacity-50 cursor-not-allowed"
                  >
                    Start Game (Waiting for Players)
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-green-600 mb-4">
                <Check className="w-5 h-5" />
                <span className="font-semibold">You're ready!</span>
              </div>
              <p className="text-gray-600">
                Waiting for the host to start the game...
              </p>
            </div>
          )}
        </div>

        {/* Session Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Sessions expire after 15 minutes of inactivity</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameLobbyScreen