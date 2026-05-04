import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './redux'
import { socketService } from '@/services/socketService'
import type { SocketEvents } from '@/services/socketService'
import { devLog } from '@/utils/devLog'
import { apiSlice } from '@/services/api'
import {
  setGameStatus,
  incrementPlayerCount,
  decrementPlayerCount,
  selectCurrentPlayerId,
} from '@/store/slices/gameSessionSlice'
import {
  addPlayer,
  updatePlayer,
  updatePlayerConnectionStatus,
  removePlayer,
} from '@/store/slices/allPlayersSlice'
import { addPendingReview, removePendingReview } from '@/store/slices/auditSlice'
import { updateTransaction, clearPendingTransaction } from '@/store/slices/transactionSlice'
import {
  showExpiryWarning,
  addNotification,
  setReconnecting,
  openModal,
} from '@/store/slices/uiSlice'
import { updateCashOnHand, updateFinancials } from '@/store/slices/playerSlice'
import { ROUTES } from '@/constants/routes'
import { mapBackendAssets, mapBackendLiabilities } from '@/utils/assetMapping'

export const useSocketEvents = (roomCode: string | null) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  // The current user's playerId is stored in the gameSession slice on
  // create/join. We compare against it on every cross-player socket event
  // so the user's own dashboard (`playerSlice`) updates alongside the
  // all-players overview (`allPlayersSlice`) — without it, the dashboard
  // only refreshed via `apiSlice.util.invalidateTags(['Player'])`, which
  // requires `useGetPlayerQuery` to currently be subscribed (i.e. the
  // user has to be on the dashboard at the moment the event fires).
  const currentPlayerId = useAppSelector(selectCurrentPlayerId)

  // Generate notification IDs
  const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Event handlers
  const handlePlayerJoined = useCallback(
    (data: SocketEvents['player:joined']) => {
      dispatch(
        addPlayer({
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
        })
      )
      dispatch(incrementPlayerCount())
      dispatch(
        addNotification({
          id: generateId(),
          type: 'info',
          message: `${data.playerName} joined the game`,
          duration: 3000,
        })
      )
    },
    [dispatch]
  )

  const handleGameStarted = useCallback(() => {
    dispatch(setGameStatus('active'))
    dispatch(
      addNotification({
        id: generateId(),
        type: 'success',
        message: 'Game has started!',
        duration: 5000,
      })
    )
    // Navigate to dashboard when game starts
    if (roomCode) {
      navigate(ROUTES.GAME_DASHBOARD.replace(':roomCode', roomCode))
    }
  }, [dispatch, navigate, roomCode])

  const handleTransactionPending = useCallback(
    (data: SocketEvents['transaction:pending']) => {
      devLog('[FRONTEND] Received transaction:pending (room-wide notification):', data)
      // This is just a room-wide notification that a transaction was created
      // The actual audit request comes via 'audit:requested' event
      // We don't add to audit queue here - that's handled by audit:requested
    },
    [dispatch]
  )

  const handlePaymentRequested = useCallback(
    (data: SocketEvents['payment:requested']) => {
      devLog('[FRONTEND] ✅ Received payment:requested event:', data)

      // Show notification to the payer
      dispatch(
        addNotification({
          id: generateId(),
          type: 'warning',
          message: `${data.collectorName} is requesting $${data.amount.toLocaleString()} from you`,
          duration: 10000,
          actionLabel: 'Review Payment',
          actionPath: roomCode ? `/game/${roomCode}/audits` : undefined,
        })
      )
    },
    [dispatch, roomCode]
  )

  const handleAuditRequested = useCallback(
    (data: SocketEvents['audit:requested']) => {
      devLog('[FRONTEND] ✅ Received audit:requested event:', data)
      devLog('[FRONTEND] Adding to audit queue for transaction:', data.transactionId)

      const auditPayload = {
        transactionId: data.transactionId,
        playerId: data.playerId,
        playerName: data.playerName,
        transactionType: data.type as any,
        transactionDetails: {
          ...data.impact,
          subType: (data as any).subType, // Include subType for determining transaction kind
        },
        submittedAt: new Date().toISOString(),
      }
      devLog('[FRONTEND] Audit payload:', auditPayload)

      // Add to audit queue for the auditor
      dispatch(addPendingReview(auditPayload))
      devLog('[FRONTEND] ✅ Added to pending reviews')

      const notificationId = generateId()
      const notification = {
        id: notificationId,
        type: 'warning' as const,
        message: `${data.playerName} submitted a ${data.type} for your review`,
        duration: 8000, // Longer duration for audit notifications
        actionLabel: 'Review Now',
        actionPath: roomCode ? `/game/${roomCode}/audits` : undefined,
      }
      devLog('[FRONTEND] Notification payload:', notification)

      dispatch(addNotification(notification))
      devLog('[FRONTEND] ✅ Notification dispatched')
    },
    [dispatch, roomCode]
  )

  const handleTransactionFinalized = useCallback(
    (data: SocketEvents['transaction:finalized']) => {
      if (data.approved) {
        dispatch(clearPendingTransaction())
        // The actual financial deltas land via the companion `player:updated`
        // event the backend emits immediately after this one — see
        // `handlePlayerUpdated`. The previous `data.playerData` branch was
        // dead code (the backend never sent that field, the type was wrong,
        // and the dashboard relied on `invalidateTags` to refetch which
        // only worked when the dashboard was actively subscribed).
        dispatch(
          updateTransaction({
            id: data.transactionId,
            status: 'approved',
          })
        )
        dispatch(
          addNotification({
            id: generateId(),
            type: 'success',
            message: '✅ Transaction approved! Your finances have been updated.',
            duration: 5000,
          })
        )
      }
      dispatch(removePendingReview(data.transactionId))
      // Invalidate the dashboard query — covers active subscribers; the
      // `player:updated` event covers the unsubscribed case.
      dispatch(apiSlice.util.invalidateTags(['Player', 'AllPlayers']))
    },
    [dispatch]
  )

  const handleTransactionRejected = useCallback(
    (data: SocketEvents['transaction:rejected']) => {
      dispatch(
        updateTransaction({
          id: data.transactionId,
          status: 'rejected',
          auditorNote: data.note,
        })
      )
      // Open rejection modal via UI slice
      dispatch(openModal('transaction_rejected'))
      dispatch(
        addNotification({
          id: generateId(),
          type: 'error',
          message: `❌ Transaction rejected. See details to correct.`,
          duration: 5000,
        })
      )
      dispatch(removePendingReview(data.transactionId))
    },
    [dispatch]
  )

  const handlePaydayCollected = useCallback(
    (data: SocketEvents['payday:collected']) => {
      // Use the post-credit total (`newCashOnHand`) the backend already
      // computed — not the PAYDAY amount itself. The previous code wrote
      // `data.amount` here, which silently replaced cashOnHand with just
      // the PAYDAY value (e.g. $7,400 → $2,400) on every other player's
      // overview. The collecting player's own dashboard re-fetched and
      // hid the bug.
      dispatch(
        updatePlayer({
          id: data.playerId,
          cashOnHand: data.newCashOnHand,
        })
      )
      // When the PAYDAY is the current user's, also write to `playerSlice`
      // so the dashboard's metric cards update without waiting for an RTK
      // Query refetch (which only fires if the dashboard is currently
      // subscribed).
      if (data.playerId === currentPlayerId) {
        dispatch(updateCashOnHand(data.newCashOnHand))
      }
      dispatch(apiSlice.util.invalidateTags(['AllPlayers']))
    },
    [dispatch, currentPlayerId]
  )

  const handlePlayerUpdated = useCallback(
    (data: SocketEvents['player:updated']) => {
      // Backend emits fields at the top level. The previous `...data.data`
      // spread did nothing because `data.data` was undefined.
      const { playerId, ...fields } = data
      dispatch(updatePlayer({ id: playerId, ...fields }))

      // When the event is for the current user, mirror the financial
      // fields onto `playerSlice` so the dashboard re-renders even if
      // its RTK Query isn't currently subscribed (the user might be on
      // the loan / buy / lobby screen waiting for their auditor's
      // approval).
      if (playerId === currentPlayerId) {
        const financialFields: Record<string, unknown> = {}
        if (fields.cashOnHand !== undefined)
          financialFields.cashOnHand = fields.cashOnHand
        if (fields.totalIncome !== undefined)
          financialFields.totalIncome = fields.totalIncome
        if (fields.totalExpenses !== undefined)
          financialFields.totalExpenses = fields.totalExpenses
        if (fields.cashflow !== undefined)
          financialFields.cashflow = fields.cashflow
        if (fields.passiveIncome !== undefined)
          financialFields.passiveIncome = fields.passiveIncome
        if (fields.isOnFastTrack !== undefined)
          financialFields.isOnFastTrack = fields.isOnFastTrack
        // Audit-approval emits include the post-approval portfolio so screens
        // that read `selectCurrentPlayer().assets` (AssetDetailScreen,
        // LiabilityDetailScreen) reflect the new state without depending on
        // useGetPlayerQuery being subscribed at the moment the audit lands.
        if (fields.assets !== undefined)
          financialFields.assets = mapBackendAssets(fields.assets)
        if (fields.liabilities !== undefined)
          financialFields.liabilities = mapBackendLiabilities(fields.liabilities)
        if (Object.keys(financialFields).length > 0) {
          dispatch(updateFinancials(financialFields as any))
        }
      }
    },
    [dispatch, currentPlayerId]
  )

  const handlePlayerDisconnected = useCallback(
    (data: SocketEvents['player:disconnected']) => {
      dispatch(
        updatePlayerConnectionStatus({
          playerId: data.playerId,
          status: 'disconnected',
        })
      )
      dispatch(
        addNotification({
          id: generateId(),
          type: 'warning',
          message: 'A player has disconnected',
          duration: 3000,
        })
      )
    },
    [dispatch]
  )

  const handlePlayerReconnected = useCallback(
    (data: SocketEvents['player:reconnected']) => {
      dispatch(
        updatePlayerConnectionStatus({
          playerId: data.playerId,
          status: 'connected',
        })
      )
      dispatch(
        addNotification({
          id: generateId(),
          type: 'info',
          message: 'Player reconnected',
          duration: 3000,
        })
      )
    },
    [dispatch]
  )

  const handlePlayerRemoved = useCallback(
    (data: SocketEvents['player:removed']) => {
      dispatch(removePlayer(data.playerId))
      dispatch(decrementPlayerCount())
      dispatch(
        addNotification({
          id: generateId(),
          type: 'warning',
          message: `Player removed: ${data.reason}`,
          duration: 5000,
        })
      )
    },
    [dispatch]
  )

  const handleFastTrackAchieved = useCallback(
    (data: SocketEvents['fasttrack:achieved']) => {
      dispatch(
        updatePlayer({
          id: data.playerId,
          isOnFastTrack: true,
        })
      )
      dispatch(
        addNotification({
          id: generateId(),
          type: 'success',
          message: `🎉 ${data.playerName} escaped the Rat Race!`,
          duration: 10000,
        })
      )
    },
    [dispatch]
  )

  const handleSessionExpiryWarning = useCallback(
    (data: SocketEvents['session:expiry_warning']) => {
      dispatch(showExpiryWarning(data.minutesRemaining))
    },
    [dispatch]
  )

  const handleSessionExpired = useCallback(() => {
    dispatch(openModal('session-expired'))
    dispatch(setGameStatus('expired'))
  }, [dispatch])

  // Connect, register handlers, and join room - all in one effect to avoid race conditions
  useEffect(() => {
    if (!roomCode) return

    const connectAndSetup = async () => {
      try {
        devLog('[SOCKET EVENTS] Connecting to socket...')
        dispatch(setReconnecting(true))

        // FIRST: Clear any existing handlers to prevent duplicates (React Strict Mode)
        devLog('[SOCKET EVENTS] Clearing existing handlers')
        socketService.offEvent('player:joined')
        socketService.offEvent('game:started')
        socketService.offEvent('transaction:pending')
        socketService.offEvent('payment:requested')
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

        // SECOND: Register all event handlers BEFORE connecting
        devLog('[SOCKET EVENTS] Registering all event handlers for room:', roomCode)
        socketService.onEvent('player:joined', handlePlayerJoined)
        socketService.onEvent('game:started', handleGameStarted)
        socketService.onEvent('transaction:pending', handleTransactionPending)
        socketService.onEvent('payment:requested', handlePaymentRequested)
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
        devLog('[SOCKET EVENTS] ✅ All event handlers registered')

        // THIRD: Connect to socket
        await socketService.connect()

        // FOURTH: Join room
        const playerId = sessionStorage.getItem('playerId')
        devLog('[SOCKET EVENTS] About to join room with playerId:', playerId)
        socketService.joinRoom(roomCode, playerId || undefined)

        dispatch(setReconnecting(false))
        devLog('[SOCKET EVENTS] ✅ Connected and joined room successfully')
      } catch (error) {
        console.error('[SOCKET EVENTS] ❌ Failed to connect to socket:', error)
        dispatch(setReconnecting(false))
        dispatch(
          addNotification({
            id: generateId(),
            type: 'error',
            message: 'Failed to connect to server',
            duration: 5000,
          })
        )
      }
    }

    connectAndSetup()

    // Cleanup on unmount
    return () => {
      devLog('[SOCKET EVENTS] Cleaning up - leaving room and removing handlers')
      socketService.leaveRoom()
      socketService.offEvent('player:joined', handlePlayerJoined)
      socketService.offEvent('game:started', handleGameStarted)
      socketService.offEvent('transaction:pending', handleTransactionPending)
      socketService.offEvent('payment:requested', handlePaymentRequested)
      socketService.offEvent('audit:requested', handleAuditRequested)
      socketService.offEvent('transaction:finalized', handleTransactionFinalized)
      socketService.offEvent('transaction:rejected', handleTransactionRejected)
      socketService.offEvent('payday:collected', handlePaydayCollected)
      socketService.offEvent('player:updated', handlePlayerUpdated)
      socketService.offEvent('player:disconnected', handlePlayerDisconnected)
      socketService.offEvent('player:reconnected', handlePlayerReconnected)
      socketService.offEvent('player:removed', handlePlayerRemoved)
      socketService.offEvent('fasttrack:achieved', handleFastTrackAchieved)
      socketService.offEvent('session:expiry_warning', handleSessionExpiryWarning)
      socketService.offEvent('session:expired', handleSessionExpired)
    }
  }, [
    roomCode,
    dispatch,
    handlePlayerJoined,
    handleGameStarted,
    handleTransactionPending,
    handlePaymentRequested,
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

  return {
    isConnected: socketService.isConnected(),
    socketId: socketService.getSocketId(),
  }
}
