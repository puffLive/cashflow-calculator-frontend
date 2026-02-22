import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useGetGameSessionQuery } from '@/services/gameApi'
import { ROUTES } from '@/constants/routes'

interface ProtectedRouteProps {
  children: ReactNode
  requireSetup?: boolean
}

/**
 * ProtectedRoute component for game routes
 * - Validates room code exists
 * - Validates game session status
 * - Optionally redirects to setup if player not ready
 */
export const ProtectedRoute = ({ children, requireSetup = false }: ProtectedRouteProps) => {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [shouldNavigate, setShouldNavigate] = useState(false)

  // Fetch game session to validate
  const {
    data: session,
    isLoading,
    isError,
    error,
  } = useGetGameSessionQuery(roomCode || '', {
    skip: !roomCode,
  })

  useEffect(() => {
    if (!isLoading && !session && isError) {
      // Delay navigation to prevent hydration issues
      const timer = setTimeout(() => setShouldNavigate(true), 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, session, isError])

  // No room code in URL
  if (!roomCode) {
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
    if (session.status === 'waiting' && requireSetup) {
      return <Navigate to={ROUTES.GAME_LOBBY.replace(':roomCode', roomCode)} replace />
    }

    // Check if game has expired
    if (session.status === 'expired') {
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
