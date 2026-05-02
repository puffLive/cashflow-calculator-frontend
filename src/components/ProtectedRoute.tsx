import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useGetGameSessionQuery } from '@/services/gameApi'
import { ROUTES } from '@/constants/routes'

interface ProtectedRouteProps {
  children: ReactNode
  /** Gameplay routes require the player to have completed setup. */
  requireSetup?: boolean
  /**
   * Lobby route guard: when the game has already started (status === 'active'),
   * bounce the user forward to the dashboard rather than letting them stay
   * on the lobby waiting for a "Start" button that already fired.
   */
  redirectIfStarted?: boolean
  /**
   * Setup route guard: when the player has already finished setup, bounce
   * them to the dashboard (or lobby if the game hasn't started yet).
   * Prevents re-entering the setup wizard from a stale URL.
   */
  redirectIfSetupComplete?: boolean
}

const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/

/**
 * ProtectedRoute component for game routes
 * - Validates room code exists + matches the 6-char alphanumeric format
 * - Validates game session status (404 / 410 / expired surfaces)
 * - Optionally redirects to setup if player not ready (`requireSetup`)
 * - Optionally bounces forward when the user lands on a stale phase route
 *   (`redirectIfStarted`, `redirectIfSetupComplete`)
 */
export const ProtectedRoute = ({
  children,
  requireSetup = false,
  redirectIfStarted = false,
  redirectIfSetupComplete = false,
}: ProtectedRouteProps) => {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [shouldNavigate, setShouldNavigate] = useState(false)

  // Skip the API call entirely if the URL's room code is malformed —
  // hitting the server with a known-bad value just to get a 400 burns a
  // round-trip and produces a worse error UI.
  const malformedRoomCode = !roomCode || !ROOM_CODE_PATTERN.test(roomCode)

  // Fetch game session to validate
  const {
    data: session,
    isLoading,
    isError,
    error,
  } = useGetGameSessionQuery(roomCode || '', {
    skip: !roomCode || malformedRoomCode,
  })

  useEffect(() => {
    if (!isLoading && !session && isError) {
      // Delay navigation to prevent hydration issues
      const timer = setTimeout(() => setShouldNavigate(true), 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, session, isError])

  // No room code in URL, or room code doesn't match the expected format —
  // bounce to landing rather than rendering an inline error for what is
  // almost certainly a bookmark to a dead URL.
  if (!roomCode || malformedRoomCode) {
    return <Navigate to={ROUTES.LANDING} replace />
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }

  // Invalid or expired room code
  if (shouldNavigate || isError) {
    const errorMessage =
      error && 'status' in error && error.status === 404
        ? 'Room code not found'
        : error && 'status' in error && error.status === 410
          ? 'Game session has expired'
          : 'Unable to load game session'

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{errorMessage}</h1>
          <p className="text-gray-600 mb-6">
            {error && 'status' in error && error.status === 404
              ? 'The room code you entered does not exist. Please check the code and try again.'
              : error && 'status' in error && error.status === 410
                ? 'This game session has expired due to inactivity.'
                : 'There was a problem loading this game. Please try again.'}
          </p>
          <a
            href={ROUTES.LANDING}
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  // Game session found but status check
  if (session) {
    // Check if game hasn't started yet and user is trying to access game routes
    const isWaiting = session.status === 'waiting'
    const isActive = session.status === 'active'
    if (isWaiting && requireSetup) {
      return <Navigate to={ROUTES.GAME_LOBBY.replace(':roomCode', roomCode)} replace />
    }

    // Inverse: user landed on a stale phase URL after the game advanced.
    // (a) On the lobby route once the game has started → forward to dashboard.
    // (b) On the setup route once setup is complete → forward to dashboard
    //     (or lobby if the game hasn't started yet).
    const playerSetupCompleteFlag = sessionStorage.getItem('playerSetupComplete') === 'true'
    if (redirectIfStarted && isActive) {
      return <Navigate to={ROUTES.GAME_DASHBOARD.replace(':roomCode', roomCode)} replace />
    }
    if (redirectIfSetupComplete && playerSetupCompleteFlag) {
      const target = isActive ? ROUTES.GAME_DASHBOARD : ROUTES.GAME_LOBBY
      return <Navigate to={target.replace(':roomCode', roomCode)} replace />
    }

    // Check if game has expired
    const isExpired = session.status === 'expired'
    if (isExpired) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-600 text-6xl mb-4">⏰</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h1>
            <p className="text-gray-600 mb-6">
              This game session has expired due to inactivity. All players have been removed.
            </p>
            <a
              href={ROUTES.LANDING}
              className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Return to Home
            </a>
          </div>
        </div>
      )
    }

    // Check if player has completed setup (stored in sessionStorage)
    const playerId = sessionStorage.getItem('playerId')
    const playerSetupComplete = sessionStorage.getItem('playerSetupComplete')

    if (requireSetup && (!playerId || playerSetupComplete !== 'true')) {
      // Redirect to setup if they haven't completed it
      return <Navigate to={ROUTES.GAME_SETUP.replace(':roomCode', roomCode)} replace />
    }
  }

  // All checks passed - render children
  return <>{children}</>
}
