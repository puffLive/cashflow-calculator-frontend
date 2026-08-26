import { apiSlice } from './api'
import { setPendingTransaction } from '@/store/slices/transactionSlice'

export interface Transaction {
  id: string
  roomCode: string
  playerId: string
  playerName?: string
  type: 'buy' | 'sell' | 'loan' | 'payday' | 'market_event' | 'expense' | 'payment' | 'undo'
  subType?: string
  /** Backend-authored human description, e.g. "Bought 10 shares of OK4U". */
  description?: string
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

/**
 * Normalize a backend transaction document into the shape the screens use.
 * The API sends `{_id, playerId: {_id, playerName}, type: 'loan_take'|…,
 * auditStatus, description, amountsChanged, createdAt}` — there is no
 * `details`, `status`, or `timestamp` field on the wire, and reading them
 * raw crashed the history screen and emptied the activity feed.
 */
function normalizeTransaction(t: any): Transaction {
  const rawType = t.type
  const type =
    rawType === 'loan_take' || rawType === 'loan_payoff' ? 'loan' : rawType
  const subType =
    rawType === 'loan_take' ? 'take' : rawType === 'loan_payoff' ? 'payoff' : t.subType
  const auditStatus = t.auditStatus ?? t.status ?? 'pending'
  const cashChange = t.amountsChanged?.cashOnHand
  const cashOnHandDelta =
    typeof cashChange?.after === 'number' && typeof cashChange?.before === 'number'
      ? cashChange.after - cashChange.before
      : undefined
  return {
    id: String(t._id ?? t.id ?? ''),
    roomCode: t.roomCode ?? '',
    playerId: String(t.playerId?._id ?? t.playerId ?? ''),
    playerName: t.playerId?.playerName ?? t.playerName,
    type,
    subType,
    description: t.description,
    details: t.details ?? t.amountsChanged ?? {},
    // 'not_required' (payday) renders like an approved entry
    status: auditStatus === 'not_required' ? 'approved' : auditStatus,
    auditorNote: t.auditorNote ?? undefined,
    timestamp: t.createdAt ?? t.timestamp ?? '',
    financialImpact:
      t.financialImpact ?? (cashOnHandDelta !== undefined ? { cashOnHandDelta } : undefined),
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
      // The backend uses a DIFFERENT route per transaction category, and
      // `POST /transactions` only accepts `type:'buy'`. Route here so every
      // screen can keep calling the one mutation:
      //   sell         → POST …/transactions/sell   { type:'sell', assetId, salePrice, quantity? }
      //   loan payoff  → POST …/transactions/payoff { type:'loan_payoff', liabilityId, payoffAmount }
      //   market_event → POST …/market-event        { type:'market_event', subType, … }
      //   buy          → POST …/transactions        { type:'buy', subType, …details }
      // Details are flattened at the top level: validators and controllers
      // read fields directly off `req.body` (e.g. `body('stockName')`).
      query: ({ roomCode, playerId, type, subType, details }) => {
        const base = `/games/${roomCode}/players/${playerId}`

        if (type === 'sell') {
          return {
            url: `${base}/transactions/sell`,
            method: 'POST',
            body: {
              type: 'sell',
              assetId: details.assetId,
              // Engine semantics: salePrice is the TOTAL proceeds
              // (cashDelta = salePrice), not a per-unit price.
              salePrice: details.totalProceeds ?? details.salePrice,
              ...(details.quantity ? { quantity: details.quantity } : {}),
            },
          }
        }

        if (type === 'loan' && subType === 'payoff') {
          return {
            url: `${base}/transactions/payoff`,
            method: 'POST',
            body: {
              type: 'loan_payoff',
              liabilityId: details.liabilityId,
              payoffAmount: details.payoffAmount,
            },
          }
        }

        if (type === 'market_event') {
          const { isLending, ...rest } = details
          const amount =
            subType === 'lend_collect' && isLending
              ? -Math.abs(Number(details.amount) || 0)
              : details.amount
          return {
            url: `${base}/market-event`,
            method: 'POST',
            body: { type: 'market_event', subType, ...rest, amount },
          }
        }

        return {
          url: `${base}/transactions`,
          method: 'POST',
          body: { type, subType, ...details },
        }
      },
      invalidatesTags: ['Transactions', 'Player'],
      // Record the submitted transaction as THE pending transaction. This
      // powers the dashboard action lockout, the pending banner + re-notify
      // flow, and gives the rejection modal its note/edit context. Cleared
      // by the transaction:finalized socket event (or modal close on
      // rejection).
      async onQueryStarted({ roomCode, playerId, type, subType, details }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const resp = data as any
          if (resp?.status === 'pending' && resp?.transactionId) {
            dispatch(
              setPendingTransaction({
                id: String(resp.transactionId),
                roomCode,
                playerId,
                type,
                subType,
                details,
                status: 'pending',
                timestamp: new Date().toISOString(),
              }),
            )
          }
        } catch {
          // Submission failed — nothing pending to record.
        }
      },
    }),

    getTransactions: builder.query<Transaction[], GetTransactionsRequest>({
      query: ({ roomCode, ...params }) => ({
        url: `/games/${roomCode}/transactions`,
        params,
      }),
      transformResponse: (response: any) => {
        // Handle different response formats from backend
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.transactions)
            ? response.transactions
            : Array.isArray(response?.data)
              ? response.data
              : []
        return list.map(normalizeTransaction)
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
