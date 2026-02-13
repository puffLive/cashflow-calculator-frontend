import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { selectAllPlayers } from '@/store/slices/allPlayersSlice'
import { selectCurrentPlayer } from '@/store/slices/playerSlice'
import { useReassignAuditorMutation } from '@/services/gameApi'
import { AlertTriangle, User, X } from 'lucide-react'

interface AuditorDisconnectedAlertProps {
  auditorId: string
  onDismiss?: () => void
}

const AuditorDisconnectedAlert = ({ auditorId, onDismiss }: AuditorDisconnectedAlertProps) => {
  const { roomCode } = useParams<{ roomCode: string }>()
  const players = useAppSelector(selectAllPlayers)
  const currentPlayer = useAppSelector(selectCurrentPlayer)
  const [reassignAuditor, { isLoading }] = useReassignAuditorMutation()
  const [selectedAuditorId, setSelectedAuditorId] = useState<string>('')
  const [showReassignModal, setShowReassignModal] = useState(false)

  const auditor = players.find((p) => p.id === auditorId)
  const availableAuditors = players.filter(
    (p) => p.id !== currentPlayer.id && p.connectionStatus === 'connected' && p.id !== auditorId
  )

  const handleReassign = async () => {
    if (!roomCode || !currentPlayer.id || !selectedAuditorId) return

    try {
      await reassignAuditor({
        roomCode,
        playerId: currentPlayer.id,
        newAuditorPlayerId: selectedAuditorId,
      }).unwrap()

      setShowReassignModal(false)
      if (onDismiss) onDismiss()
    } catch (err) {
      console.error('Failed to reassign auditor:', err)
    }
  }

  if (!auditor || auditor.connectionStatus === 'connected') return null

  return (
    <>
      {/* Alert Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-amber-900 mb-1">Auditor Disconnected</h3>
            <p className="text-sm text-amber-800 mb-3">
              {auditor.connectionStatus === 'removed' ? (
                <>
                  Your auditor <span className="font-semibold">{auditor.name}</span> has been removed after 15 minutes
                  of inactivity. Please select a new auditor to continue.
                </>
              ) : (
                <>
                  Your auditor <span className="font-semibold">{auditor.name}</span> has disconnected. Pending
                  reviews are paused.
                </>
              )}
            </p>
            <button
              onClick={() => setShowReassignModal(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
            >
              {auditor.connectionStatus === 'removed' ? 'Select New Auditor' : 'Reassign Auditor'}
            </button>
          </div>
          {onDismiss && auditor.connectionStatus !== 'removed' && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss alert"
            >
              <X className="h-5 w-5 text-amber-600" />
            </button>
          )}
        </div>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select New Auditor</h3>

            {availableAuditors.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">
                  No other connected players available. Wait for other players to join or reconnect.
                </p>
              </div>
            ) : (
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {availableAuditors.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedAuditorId(player.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                      selectedAuditorId === player.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{player.name}</p>
                        <p className="text-xs text-gray-600">{player.profession || 'Player'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowReassignModal(false)}
                disabled={isLoading}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={!selectedAuditorId || isLoading || availableAuditors.length === 0}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Assigning...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AuditorDisconnectedAlert
