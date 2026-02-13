import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { selectAllPlayers } from '@/store/slices/allPlayersSlice'
import { useGetAllPlayersQuery } from '@/services/gameApi'
import PlayerCard from '@/components/PlayerCard'
import ActivityFeed from '@/components/ActivityFeed'
import BottomNavBar from '@/components/BottomNavBar'
import { ArrowLeft, Users, Loader2, Activity } from 'lucide-react'

const PlayersOverviewScreen = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const playerId = sessionStorage.getItem('playerId')
  const [activeTab, setActiveTab] = useState<'players' | 'activity'>('players')

  // Fetch all players (updates Redux state)
  const { isLoading, error } = useGetAllPlayersQuery(
    roomCode!,
    { skip: !roomCode, pollingInterval: 5000 }
  )

  const players = useAppSelector(selectAllPlayers)

  useEffect(() => {
    if (!playerId || !roomCode) {
      navigate('/')
    }
  }, [playerId, roomCode, navigate])

  if (isLoading && players.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading players...</p>
        </div>
      </div>
    )
  }

  if (error && players.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Players</h2>
          <p className="text-gray-600 mb-6">Failed to load player data</p>
          <button
            onClick={() => navigate(`/game/${roomCode}/dashboard`)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const sortedPlayers = [...players].sort((a, b) => {
    // Current player first
    if (a.id === playerId) return -1
    if (b.id === playerId) return 1
    // Then by connection status (connected first)
    if (a.connectionStatus === 'connected' && b.connectionStatus !== 'connected') return -1
    if (b.connectionStatus === 'connected' && a.connectionStatus !== 'connected') return 1
    // Then alphabetically
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/game/${roomCode}/dashboard`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">All Players</h1>
                <p className="text-sm text-gray-600">
                  {players.length} player{players.length !== 1 ? 's' : ''} in game
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'players'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Players</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Activity</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'players' ? (
        <div className="px-4 py-4 space-y-3">
          {sortedPlayers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Players Yet</h3>
              <p className="text-gray-600">Players will appear here once they join the game.</p>
            </div>
          ) : (
            sortedPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === playerId}
              />
            ))
          )}
        </div>
      ) : (
        <div className="px-4 py-4">
          <ActivityFeed roomCode={roomCode!} limit={30} />
        </div>
      )}

      {/* Summary Stats */}
      {players.length > 0 && (
        <div className="px-4 py-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-4">Game Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Players</p>
                <p className="text-lg font-bold text-gray-900">{players.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">On Fast Track</p>
                <p className="text-lg font-bold text-green-600">
                  {players.filter((p) => p.isOnFastTrack).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Connected</p>
                <p className="text-lg font-bold text-blue-600">
                  {players.filter((p) => p.connectionStatus === 'connected').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">In Rat Race</p>
                <p className="text-lg font-bold text-gray-600">
                  {players.filter((p) => !p.isOnFastTrack).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  )
}

export default PlayersOverviewScreen
