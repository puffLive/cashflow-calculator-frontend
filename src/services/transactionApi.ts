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
      providesTags: ['Transactions'],
    }),

    auditTransaction: builder.mutation<TransactionResponse, AuditTransactionRequest>({
      query: ({ roomCode, transactionId, auditorId, action, note }) => {
        console.log('[AUDIT API] Request:', { roomCode, transactionId, auditorId, action, note })
        return {
          url: `/games/${roomCode}/transactions/${transactionId}/audit?auditorId=${encodeURIComponent(auditorId)}`,
          method: 'PATCH',
          body: { action, ...(note && { note }) },
        }
      },
      invalidatesTags: ['Transactions', 'Player', 'AllPlayers'],
    }),

    undoTransaction: builder.mutation<TransactionResponse, { roomCode: string; playerId: string }>({
      query: ({ roomCode, playerId }) => ({
        url: `/games/${roomCode}/players/${playerId}/undo`,
        method: 'POST',
      }),
      invalidatesTags: ['Transactions', 'Player'],
    }),
  }),
})

export const {
  useSubmitTransactionMutation,
  useGetTransactionsQuery,
  useAuditTransactionMutation,
  useUndoTransactionMutation,
} = transactionApi