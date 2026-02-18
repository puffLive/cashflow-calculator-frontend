import { useEffect, useCallback } from 'react'
import { useAppDispatch } from './redux'
import { socketService } from '@/services/socketService'
import type { SocketEvents } from '@/services/socketService'
import { apiSlice } from '@/services/api'
import {
  setGameStatus,
  incrementPlayerCount,
  decrementPlayerCount,
} from '@/store/slices/gameSessionSlice'
import {
  addPlayer,
  updatePlayer,
  updatePlayerConnectionStatus,
  removePlayer,
} from '@/store/slices/allPlayersSlice'
import {
  addPendingReview,
  removePendingReview,
} from '@/store/slices/auditSlice'
import {
  updateTransaction,
  clearPendingTransaction,
} from '@/store/slices/transactionSlice'
import {
  showExpiryWarning,
  addNotification,
  setReconnecting,
  openModal,
} from '@/store/slices/uiSlice'
import { updateFinancials } from '@/store/slices/playerSlice'

export const useSocketEvents = (roomCode: string | null) => {
  const dispatch = useAppDispatch()

  // Generate notification IDs
  const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Event handlers
  const handlePlayerJoined = useCallback((data: SocketEvents['player:joined']) => {
    dispatch(addPlayer({
      id: data.playerId,
      name: data.playerName,
      cashOnHand: 0,
      cashflow: 0,
      paydayAmount: 0,
      passiveIncome: 0,
      totalExpenses: 0,
      assetCount: 0,
      isOnFastTrack: false,
      connectionStatus: 'connected',
      isReady: false,
      isHost: false,
    }))
    dispatch(incrementPlayerCount())
    dispatch(addNotification({
      id: generateId(),
      type: 'info',
      message: `${data.playerName} joined the game`,
      duration: 3000,
    }))
  }, [dispatch])

  const handleGameStarted = useCallback(() => {
    dispatch(setGameStatus('active'))
    dispatch(addNotification({
      id: generateId(),
      type: 'success',
      message: 'Game has started!',
      duration: 5000,
    }))
    // TODO: Navigate to dashboard
  }, [dispatch])

  const handleTransactionPending = useCallback((data: SocketEvents['transaction:pending']) => {
    console.log('[FRONTEND] Received transaction:pending (room-wide notification):', data)
    // This is just a room-wide notification that a transaction was created
    // The actual audit request comes via 'audit:requested' event
    // We don't add to audit queue here - that's handled by audit:requested
  }, [dispatch])

  const handleAuditRequested = useCallback((data: SocketEvents['audit:requested']) => {
    console.log('[FRONTEND] ✅ Received audit:requested event:', data)
    console.log('[FRONTEND] Adding to audit queue for transaction:', data.transactionId)

    const auditPayload = {
      transactionId: data.transactionId,
      playerId: data.playerId,
      playerName: data.playerName,
      transactionType: data.type as any,
      transactionDetails: data.impact || {},
      submittedAt: new Date().toISOString(),
    }
    console.log('[FRONTEND] Audit payload:', auditPayload)

    // Add to audit queue for the auditor
    dispatch(addPendingReview(auditPayload))
    console.log('[FRONTEND] ✅ Added to pending reviews')

    const notificationId = generateId()
    const notification = {
      id: notificationId,
      type: 'warning' as const,
      message: `${data.playerName} submitted a ${data.type} for your review`,
      duration: 8000, // Longer duration for audit notifications
      actionLabel: 'Review Now',
      actionPath: roomCode ? `/game/${roomCode}/audits` : undefined,
    }
    console.log('[FRONTEND] Notification payload:', notification)

    dispatch(addNotification(notification))
    console.log('[FRONTEND] ✅ Notification dispatched')
  }, [dispatch, roomCode])

  const handleTransactionFinalized = useCallback((data: SocketEvents['transaction:finalized']) => {
    if (data.approved) {
      dispatch(clearPendingTransaction())
      if (data.playerData) {
        dispatch(updateFinancials(data.playerData))
      }
      dispatch(updateTransaction({
        id: data.transactionId,
        status: 'approved',
      }))
      dispatch(addNotification({
        id: generateId(),
        type: 'success',
        message: 'Transaction approved!',
        duration: 3000,
      }))
    }
    dispatch(removePendingReview(data.transactionId))
    // Invalidate player data cache to refetch
    dispatch(apiSlice.util.invalidateTags(['Player', 'AllPlayers']))
  }, [dispatch])

  const handleTransactionRejected = useCallback((data: SocketEvents['transaction:rejected']) => {
    dispatch(updateTransaction({
      id: data.transactionId,
      status: 'rejected',
      auditorNote: data.note,
    }))
    dispatch(addNotification({
      id: generateId(),
      type: 'error',
      message: `Transaction rejected: ${data.note}`,
      duration: 5000,
    }))
  }, [dispatch])

  const handlePaydayCollected = useCallback((data: SocketEvents['payday:collected']) => {
    dispatch(updatePlayer({
      id: data.playerId,
      cashOnHand: data.amount, // This should be incremented, not set
    }))
    dispatch(apiSlice.util.invalidateTags(['AllPlayers']))
  }, [dispatch])

  const handlePlayerUpdated = useCallback((data: SocketEvents['player:updated']) => {
    dispatch(updatePlayer({
      id: data.playerId,
      ...data.data,
    }))
  }, [dispatch])

  const handlePlayerDisconnected = useCallback((data: SocketEvents['player:disconnected']) => {
    dispatch(updatePlayerConnectionStatus({
      playerId: data.playerId,
      status: 'disconnected',
    }))
    dispatch(addNotification({
      id: generateId(),
      type: 'warning',
      message: 'A player has disconnected',
      duration: 3000,
    }))
  }, [dispatch])

  const handlePlayerReconnected = useCallback((data: SocketEvents['player:reconnected']) => {
    dispatch(updatePlayerConnectionStatus({
      playerId: data.playerId,
      status: 'connected',
    }))
    dispatch(addNotification({
      id: generateId(),
      type: 'info',
      message: 'Player reconnected',
      duration: 3000,
    }))
  }, [dispatch])

  const handlePlayerRemoved = useCallback((data: SocketEvents['player:removed']) => {
    dispatch(removePlayer(data.playerId))
    dispatch(decrementPlayerCount())
    dispatch(addNotification({
      id: generateId(),
      type: 'warning',
      message: `Player removed: ${data.reason}`,
      duration: 5000,
    }))
  }, [dispatch])

  const handleFastTrackAchieved = useCallback((data: SocketEvents['fasttrack:achieved']) => {
    dispatch(updatePlayer({
      id: data.playerId,
      isOnFastTrack: true,
    }))
    dispatch(addNotification({
      id: generateId(),
      type: 'success',
      message: `🎉 ${data.playerName} escaped the Rat Race!`,
      duration: 10000,
    }))
  }, [dispatch])

  const handleSessionExpiryWarning = useCallback((data: SocketEvents['session:expiry_warning']) => {
    dispatch(showExpiryWarning(data.minutesRemaining))
  }, [dispatch])

  const handleSessionExpired = useCallback(() => {
    dispatch(openModal('session-expired'))
    dispatch(setGameStatus('expired'))
  }, [dispatch])

  // Set up and tear down event listeners
  useEffect(() => {
    if (!roomCode) return

    console.log('[SOCKET EVENTS] Registering all event handlers for room:', roomCode)

    // Register all event handlers
    socketService.onEvent('player:joined', handlePlayerJoined)
    socketService.onEvent('game:started', handleGameStarted)
    socketService.onEvent('transaction:pending', handleTransactionPending)
    socketService.onEvent('audit:requested', handleAuditRequested)
    socketService.onEvent('transaction:finalized', handleTransactionFinalized)
    socketService.onEvent('transaction:rejected', handleTransactionRejected)
    socketService.onEvent('payday:collected', handlePaydayCollected)
    socketService.onEvent('player:updated', handlePlayerUpdated)
    socketService.onEvent('player:disconnected', handlePlayerDisconnected)
    socketService.onEvent('player:reconnected', handlePlayerReconnected)
    socketService.onEvent('player:removed', handlePlayerRemoved)
    socketService.onEvent('fasttrack:achieved', handleFastTrackAchieved)
    socketService.onEvent('session:expiry_warning', handleSessionExpiryWarning)
    socketService.onEvent('session:expired', handleSessionExpired)

    console.log('[SOCKET EVENTS] ✅ All event handlers registered')

    // Cleanup on unmount
    return () => {
      socketService.offEvent('player:joined')
      socketService.offEvent('game:started')
      socketService.offEvent('transaction:pending')
      socketService.offEvent('audit:requested')
      socketService.offEvent('transaction:finalized')
      socketService.offEvent('transaction:rejected')
      socketService.offEvent('payday:collected')
      socketService.offEvent('player:updated')
      socketService.offEvent('player:disconnected')
      socketService.offEvent('player:reconnected')
      socketService.offEvent('player:removed')
      socketService.offEvent('fasttrack:achieved')
      socketService.offEvent('session:expiry_warning')
      socketService.offEvent('session:expired')
    }
  }, [
    roomCode,
    handlePlayerJoined,
    handleGameStarted,
    handleTransactionPending,
    handleAuditRequested,
    handleTransactionFinalized,
    handleTransactionRejected,
    handlePaydayCollected,
    handlePlayerUpdated,
    handlePlayerDisconnected,
    handlePlayerReconnected,
    handlePlayerRemoved,
    handleFastTrackAchieved,
    handleSessionExpiryWarning,
    handleSessionExpired,
  ])

  // Connect and join room
  useEffect(() => {
    if (!roomCode) return

    const connectAndJoin = async () => {
      try {
        console.log('[SOCKET EVENTS] Connecting and joining room...')
        dispatch(setReconnecting(true))
        await socketService.connect()

        // Get playerId from session storage
        const playerId = sessionStorage.getItem('playerId')
        console.log('[SOCKET EVENTS] About to join room with playerId:', playerId)
        socketService.joinRoom(roomCode, playerId || undefined)

        dispatch(setReconnecting(false))
        console.log('[SOCKET EVENTS] ✅ Connected and joined room successfully')
      } catch (error) {
        console.error('[SOCKET EVENTS] ❌ Failed to connect to socket:', error)
        dispatch(setReconnecting(false))
        dispatch(addNotification({
          id: generateId(),
          type: 'error',
          message: 'Failed to connect to server',
          duration: 5000,
        }))
      }
    }

    connectAndJoin()

    return () => {
      console.log('[SOCKET EVENTS] Leaving room:', roomCode)
      socketService.leaveRoom()
    }
  }, [roomCode, dispatch])

  return {
    isConnected: socketService.isConnected(),
    socketId: socketService.getSocketId(),
  }
}