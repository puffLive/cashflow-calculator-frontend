import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/redux'
import { setReconnecting } from '@/store/slices/uiSlice'
import { useReconnectPlayerMutation } from '@/services/gameApi'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const ReconnectionHandler = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [reconnectPlayer] = useReconnectPlayerMutation()
  const [status, setStatus] = useState<'checking' | 'reconnecting' | 'success' | 'failed' | null>(null)
  const [missedEvents, setMissedEvents] = useState<string[]>([])

  useEffect(() => {
    const attemptReconnect = async () => {
      // Check if we have session data
      const roomCode = sessionStorage.getItem('roomCode')
      const playerId = sessionStorage.getItem('playerId')
      const playerName = sessionStorage.getItem('playerName')

      // If no session data, no need to reconnect
      if (!roomCode || !playerId || !playerName) {
        return
      }

      // Check if we're already on a game page - don't reconnect if already in a game
      const currentPath = window.location.pathname
      if (currentPath.includes('/game/')) {
        // User is already on a game page, no need to reconnect
        return
      }

      // Only reconnect if user is on the landing/join/create pages but has session data
      if (!currentPath.includes('/') && !currentPath.includes('/join') && !currentPath.includes('/create')) {
        return
      }

      // Start reconnection attempt
      setStatus('checking')
      dispatch(setReconnecting(true))

      try {
        const response = await reconnectPlayer({ roomCode, playerId }).unwrap()

        // Successful reconnection
        setStatus('success')

        // Extract any missed events from the response (if available)
        const events = (response as any).missedEvents || []
        if (events.length > 0) {
          setMissedEvents(events.map((e: any) => e.type || e.message))
        }

        // Wait a moment to show success message
        setTimeout(() => {
          dispatch(setReconnecting(false))
          navigate(`/game/${roomCode}/dashboard`)
        }, 2000)
      } catch (err: any) {
        console.error('Reconnection failed:', err)
        setStatus('failed')

        // Check if session expired (15 min timeout)
        const isExpired = err?.status === 410 || err?.data?.code === 'SESSION_EXPIRED'

        if (isExpired) {
          // Clear session and show expired message
          sessionStorage.clear()
          setTimeout(() => {
            dispatch(setReconnecting(false))
            setStatus(null)
          }, 3000)
        } else {
          // Other error - dismiss after a moment
          setTimeout(() => {
            dispatch(setReconnecting(false))
            setStatus(null)
          }, 3000)
        }
      }
    }

    // Only run on mount
    attemptReconnect()
  }, []) // Empty deps - only run once on mount

  if (!status) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 text-center">
        {status === 'checking' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Checking Connection...</h2>
            <p className="text-gray-600">Please wait while we restore your session</p>
          </>
        )}

        {status === 'reconnecting' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reconnecting...</h2>
            <p className="text-gray-600">Restoring your game state</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 rounded-full p-4 inline-flex mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600 mb-4">Successfully reconnected to your game session</p>
            {missedEvents.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 font-medium mb-1">While you were away:</p>
                <ul className="text-xs text-blue-700 text-left list-disc list-inside">
                  {missedEvents.slice(0, 3).map((event, i) => (
                    <li key={i}>{event}</li>
                  ))}
                  {missedEvents.length > 3 && (
                    <li>... and {missedEvents.length - 3} more events</li>
                  )}
                </ul>
              </div>
            )}
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="bg-red-100 rounded-full p-4 inline-flex mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session Expired</h2>
            <p className="text-gray-600 mb-4">
              You were removed from the game after 15 minutes of inactivity.
            </p>
            <button
              onClick={() => {
                sessionStorage.clear()
                dispatch(setReconnecting(false))
                navigate('/')
              }}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ReconnectionHandler
