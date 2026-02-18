import { useParams } from 'react-router-dom'
import { useSocketEvents } from '@/hooks/useSocketEvents'

interface GameSocketProviderProps {
  children: React.ReactNode
}

/**
 * Wrapper component that ensures socket connection and event handlers
 * are set up for all game-related screens
 */
export const GameSocketProvider: React.FC<GameSocketProviderProps> = ({ children }) => {
  const { roomCode } = useParams<{ roomCode: string }>()

  // This will connect to socket and register all event handlers
  // for any screen under /game/:roomCode/*
  useSocketEvents(roomCode || null)

  return <>{children}</>
}
