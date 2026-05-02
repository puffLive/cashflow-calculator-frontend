import { apiSlice } from './api'

export interface Transaction {
  id: string
  roomCode: string
  playerId: string
  type: 'buy' | 'sell' | 'loan' | 'payday' | 'market_event' | 'expense' | 'payment'
  subType?: string
  details: Record<string, any>
  status: 'pending' | 'approved' | 'rejected'
  auditorId?: string
  auditorNote?: string
  timestamp: string
  financialImpact?: {
    cashOnHandDelta?: number
    incomeDelta?: number
    expenseDelta?: number
    assetChanges?: any[]
    liabilityChanges?: any[]
  }
}

interface SubmitTransactionRequest {
  roomCode: string
  playerId: string
  type: Transaction['type']
  subType?: string
  details: Record<string, any>
}

interface GetTransactionsRequest {
  roomCode: string
  playerId?: string
  type?: Transaction['type']
  limit?: number
  offset?: number
}

interface AuditTransactionRequest {
  roomCode: string
  transactionId: string
  auditorId: string
  action: 'approve' | 'reject'
  note?: string
}

interface TransactionResponse {
  transaction: Transaction
  playerUpdate?: any // Will contain updated player financial data
}

export const transactionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    submitTransaction: builder.mutation<TransactionResponse, SubmitTransactionRequest>({
      query: ({ roomCode, playerId, ...data }) => ({
        url: `/games/${roomCode}/players/${playerId}/transactions`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Transactions'],
    }),

    getTransactions: builder.query<Transaction[], GetTransactionsRequest>({
      query: ({ roomCode, ...params }) => ({
        url: `/games/${roomCode}/transactions`,
        params,
      }),
      transformResponse: (response: any) => {
        // Handle different response formats from backend
        if (Array.isArray(response)) {
          return response
        }
        // If backend returns {transactions: [...]}
        if (response?.transactions && Array.isArray(response.transactions)) {
          return response.transactions
        }
        // If backend returns {data: [...]}
        if (response?.data && Array.isArray(response.data)) {
          return response.data
        }
        // Fallback to empty array if unexpected format
        return []
      },
      providesTags: ['Transactions'],
    }),

    auditTransaction: builder.mutation<TransactionResponse, AuditTransactionRequest>({
      query: ({ roomCode, transactionId, auditorId, action, note }) => ({
        url: `/games/${roomCode}/transactions/${transactionId}/audit?auditorId=${encodeURIComponent(auditorId)}`,
        method: 'PATCH',
        body: { action, ...(note && { note }) },
      }),
      invalidatesTags: ['Transactions', 'Player', 'AllPlayers'],
    }),

    undoTransaction: builder.mutation<TransactionResponse, { roomCode: string; playerId: string }>({
      query: ({ roomCode, playerId }) => ({
        url: `/games/${roomCode}/players/${playerId}/undo`,
        method: 'POST',
      }),
      invalidatesTags: ['Transactions', 'Player'],
    }),

    /**
     * Re-notify the auditor about a still-pending transaction (Feature 10.3.4).
     * Backend route: POST /:roomCode/transactions/:transactionId/renotify?playerId=…
     * Returns `{ message, transactionId, auditorPlayerId, auditorReachable }`
     * — `auditorReachable: false` means the auditor was offline at re-notify
     * time; the room broadcast still fires so any active client gets the bump.
     */
    renotifyTransaction: builder.mutation<
      {
        message: string
        transactionId: string
        auditorPlayerId: string
        auditorReachable: boolean
      },
      { roomCode: string; transactionId: string; playerId: string }
    >({
      query: ({ roomCode, transactionId, playerId }) => ({
        url: `/games/${roomCode}/transactions/${transactionId}/renotify?playerId=${encodeURIComponent(playerId)}`,
        method: 'POST',
      }),
      // No tag invalidation — re-notify doesn't change cached data, just
      // re-emits a socket event.
    }),
  }),
})

export const {
  useSubmitTransactionMutation,
  useGetTransactionsQuery,
  useAuditTransactionMutation,
  useUndoTransactionMutation,
  useRenotifyTransactionMutation,
} = transactionApi
