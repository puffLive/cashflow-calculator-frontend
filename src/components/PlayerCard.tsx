import { useState } from 'react'
import type { PlayerSummary } from '@/store/slices/allPlayersSlice'
import { User, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react'

interface PlayerCardProps {
  player: PlayerSummary
  isCurrentPlayer?: boolean
}

const PlayerCard = ({ player, isCurrentPlayer = false }: PlayerCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getConnectionStatusIcon = () => {
    switch (player.connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-600" />
      case 'disconnected': return <WifiOff className="h-4 w-4 text-amber-600" />
      case 'removed': return <WifiOff className="h-4 w-4 text-gray-400" />
      default: return null
    }
  }

  return (
    <div
      className={`bg-white rounded-lg border-2 ${
        isCurrentPlayer ? 'border-blue-500 shadow-lg' : 'border-gray-200 shadow-sm'
      } overflow-hidden`}
    >
      {/* Card Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
              <User className="h-5 w-5 text-blue-600" />
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 truncate">
                  {player.name}
                  {isCurrentPlayer && <span className="text-blue-600 ml-1">(You)</span>}
                </h3>
                {player.isHost && (
                  <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded">
                    Host
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">{player.profession || 'Setting up...'}</p>

              {/* Status Badges */}
              <div className="flex items-center gap-2 mt-2">
                {player.isOnFastTrack && (
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                    🎯 Fast Track
                  </span>
                )}
                {!player.isOnFastTrack && (
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                    Rat Race
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Connection Status & Expand Icon */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              {getConnectionStatusIcon()}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Cash</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(player.cashOnHand)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Cashflow</p>
            <p
              className={`text-sm font-bold ${
                player.cashflow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(player.cashflow)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">PAYDAY</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(player.paydayAmount)}</p>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Passive Income:</span>
              <span className="font-medium text-green-600">{formatCurrency(player.passiveIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Expenses:</span>
              <span className="font-medium text-red-600">{formatCurrency(player.totalExpenses)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Assets Owned:</span>
              <span className="font-medium text-gray-900">{player.assetCount}</span>
            </div>

            {/* Fast Track Progress */}
            {player.passiveIncome > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Fast Track Progress</span>
                  <span className="text-xs text-gray-500">
                    {Math.min(100, Math.round((player.passiveIncome / player.totalExpenses) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      player.isOnFastTrack ? 'bg-green-600' : 'bg-yellow-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (player.passiveIncome / player.totalExpenses) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Connection Status Details */}
            {player.connectionStatus !== 'connected' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  {player.connectionStatus === 'disconnected' && '⚠️ Player disconnected'}
                  {player.connectionStatus === 'removed' && '❌ Player removed (disconnected too long)'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerCard
