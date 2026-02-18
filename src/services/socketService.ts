import { io, Socket } from 'socket.io-client'

// Socket event types
export interface SocketEvents {
  // Incoming events
  'player:joined': { playerId: string; playerName: string; roomCode: string }
  'game:started': { roomCode: string }
  'transaction:pending': { transactionId: string; playerId: string; type: string }
  'transaction:finalized': { transactionId: string; approved: boolean; playerData?: any }
  'transaction:rejected': { transactionId: string; note: string }
  'audit:requested': { transactionId: string; playerId: string; playerName: string; type: string; description: string; impact?: any }
  'payday:collected': { playerId: string; amount: number }
  'player:updated': { playerId: string; data: any }
  'player:disconnected': { playerId: string }
  'player:reconnected': { playerId: string }
  'player:removed': { playerId: string; reason: string }
  'fasttrack:achieved': { playerId: string; playerName: string }
  'session:expiry_warning': { minutesRemaining: number }
  'session:expired': { roomCode: string }

  // Outgoing events
  'join:room': { roomCode: string }
  'leave:room': { roomCode: string }
}

type EventCallback<T = any> = (data: T) => void

class SocketService {
  private socket: Socket | null = null
  private serverUrl: string = ''
  private currentRoom: string | null = null
  private eventHandlers: Map<string, Set<EventCallback>> = new Map()
  private connectionPromise: Promise<void> | null = null

  constructor() {
    this.serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
  }

  async connect(serverUrl?: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket already connected')
      return
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const url = serverUrl || this.serverUrl

      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      })

      this.socket.on('connect', () => {
        console.log('[SOCKET] Socket connected with ID:', this.socket?.id)
        resolve()
        this.connectionPromise = null
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        reject(error)
        this.connectionPromise = null
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
      })

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts')
        // Rejoin room if we were in one
        if (this.currentRoom) {
          this.joinRoom(this.currentRoom)
        }
      })

      // Set up all event listeners
      this.setupEventListeners()
    })

    return this.connectionPromise
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Forward all events to registered handlers
    const events: (keyof SocketEvents)[] = [
      'player:joined',
      'game:started',
      'transaction:pending',
      'transaction:finalized',
      'transaction:rejected',
      'audit:requested',
      'payday:collected',
      'player:updated',
      'player:disconnected',
      'player:reconnected',
      'player:removed',
      'fasttrack:achieved',
      'session:expiry_warning',
      'session:expired',
    ]

    events.forEach((event) => {
      this.socket?.on(event, (data: any) => {
        console.log(`[SOCKET] Received event: ${event}`, data)
        const handlers = this.eventHandlers.get(event)
        console.log(`[SOCKET] Handlers registered for ${event}:`, handlers?.size || 0)
        if (handlers) {
          handlers.forEach((handler) => handler(data))
        }
      })
    })
  }

  joinRoom(roomCode: string, playerId?: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected')
      return
    }

    const payload: { roomCode: string; playerId?: string } = { roomCode }
    if (playerId) {
      payload.playerId = playerId
    }

    this.socket.emit('join:room', payload)
    this.currentRoom = roomCode
    console.log('[SOCKET] Joined room:', roomCode, 'Player:', playerId, 'SocketID:', this.socket.id)
  }

  leaveRoom(): void {
    if (!this.socket?.connected || !this.currentRoom) {
      return
    }

    this.socket.emit('leave:room', { roomCode: this.currentRoom })
    console.log('Left room:', this.currentRoom)
    this.currentRoom = null
  }

  onEvent<K extends keyof SocketEvents>(
    eventName: K,
    callback: EventCallback<SocketEvents[K]>
  ): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set())
    }
    this.eventHandlers.get(eventName)?.add(callback)
    console.log(`[SOCKET] Handler registered for: ${eventName}, total handlers:`, this.eventHandlers.get(eventName)?.size)
  }

  offEvent<K extends keyof SocketEvents>(
    eventName: K,
    callback?: EventCallback<SocketEvents[K]>
  ): void {
    if (!callback) {
      // Remove all handlers for this event
      this.eventHandlers.delete(eventName)
    } else {
      // Remove specific handler
      this.eventHandlers.get(eventName)?.delete(callback)
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.leaveRoom()
      this.socket.disconnect()
      this.socket = null
      this.eventHandlers.clear()
      console.log('Socket disconnected')
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocketId(): string | undefined {
    return this.socket?.id
  }
}

// Export singleton instance
export const socketService = new SocketService()

// Export type for use in components
export type { SocketService }