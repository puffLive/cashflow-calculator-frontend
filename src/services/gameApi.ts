import { apiSlice } from './api'
import type { GameSession, Player } from '@/types'

interface CreateGameResponse {
  roomCode: string
  hostPlayerId: string
  gameSessionId: string
}

interface JoinGameRequest {
  roomCode: string
  playerName: string
}

interface JoinGameResponse {
  playerId: string
  gameSessionId: string
  roomCode: string
  playerNumber: number
  avatarColor: string
}

interface SetupPlayerRequest {
  roomCode: string
  playerId: string
  profession: string
  dream: {
    name: string
    cost: number
  }
  auditorPlayerId?: string
}

interface PlayerResponse {
  player: Player
}

export const gameApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Game Session endpoints
    createGame: builder.mutation<CreateGameResponse, { gameVersion: string; hostName: string }>({
      query: (data) => ({
        url: '/games',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['GameSession'],
    }),

    getGameSession: builder.query<GameSession, string>({
      query: (roomCode) => `/games/${roomCode}`,
      providesTags: ['GameSession'],
    }),

    joinGame: builder.mutation<JoinGameResponse, JoinGameRequest>({
      query: ({ roomCode, playerName }) => ({
        url: `/games/${roomCode}/join`,
        method: 'POST',
        body: { playerName },
      }),
      invalidatesTags: ['GameSession', 'AllPlayers'],
    }),

    startGame: builder.mutation<GameSession, { roomCode: string; playerId: string }>({
      query: ({ roomCode, playerId }) => ({
        url: `/games/${roomCode}/start`,
        method: 'PATCH',
        body: { playerId },
      }),
      invalidatesTags: ['GameSession'],
    }),

    // Player endpoints
    setupPlayer: builder.mutation<PlayerResponse, SetupPlayerRequest>({
      query: ({ roomCode, playerId, ...data }) => ({
        url: `/games/${roomCode}/players/${playerId}/setup`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Player', 'AllPlayers', 'GameSession'],
    }),

    getPlayer: builder.query<any, { roomCode: string; playerId: string }>({
      query: ({ roomCode, playerId }) => `/games/${roomCode}/players/${playerId}`,
      providesTags: ['Player'],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          console.log('Raw backend player data:', data)

          // Import setPlayerData dynamically to avoid circular dependency
          const { setPlayerData } = await import('@/store/slices/playerSlice')

          // Transform backend response to frontend format
          // Backend sends expenses as an object, convert to array for display
          const expensesArray = []
          if ((data as any).expenses) {
            const exp = (data as any).expenses
            if (exp.taxes) expensesArray.push({ id: 'taxes', name: 'Taxes', amount: exp.taxes, type: 'fixed' })
            if (exp.mortgagePayment) expensesArray.push({ id: 'mortgage', name: 'Mortgage Payment', amount: exp.mortgagePayment, type: 'fixed' })
            if (exp.schoolLoanPayment) expensesArray.push({ id: 'schoolLoan', name: 'School Loan Payment', amount: exp.schoolLoanPayment, type: 'fixed' })
            if (exp.carLoanPayment) expensesArray.push({ id: 'carLoan', name: 'Car Loan Payment', amount: exp.carLoanPayment, type: 'fixed' })
            if (exp.creditCardPayment) expensesArray.push({ id: 'creditCard', name: 'Credit Card Payment', amount: exp.creditCardPayment, type: 'fixed' })
            if (exp.bankLoanPayment) expensesArray.push({ id: 'bankLoan', name: 'Bank Loan Payment', amount: exp.bankLoanPayment, type: 'fixed' })
            if (exp.otherExpenses) expensesArray.push({ id: 'other', name: 'Other Expenses', amount: exp.otherExpenses, type: 'fixed' })
            if (exp.childExpenses) expensesArray.push({ id: 'children', name: 'Child Expenses', amount: exp.childExpenses, type: 'variable' })
          }

          // Calculate totalExpenses from the expenses object
          const calculatedTotalExpenses = expensesArray.reduce((sum, item) => sum + item.amount, 0)

          // Handle income structure (backend sends as object)
          const incomeArray = []
          if ((data as any).income?.salary) {
            incomeArray.push({ id: 'salary', name: 'Salary', amount: (data as any).income.salary, type: 'salary' })
          }
          if ((data as any).income?.passiveIncomeItems) {
            incomeArray.push(...(data as any).income.passiveIncomeItems)
          }

          const playerData = {
            id: (data as any)._id || (data as any).id,
            name: (data as any).playerName || (data as any).name,
            profession: (data as any).profession,
            dream: (data as any).dream,
            auditorPlayerId: (data as any).auditorPlayerId,
            isReady: !!(data as any).profession,
            cashOnHand: (data as any).cashOnHand || 0,
            salary: (data as any).salary || (data as any).income?.salary || 0,
            totalIncome: (data as any).totalIncome || 0,
            totalExpenses: calculatedTotalExpenses || (data as any).totalExpenses || 0,
            passiveIncome: (data as any).passiveIncome || (data as any).income?.passiveIncome || 0,
            paydayAmount: (data as any).paydayAmount || 0,
            cashflow: (data as any).cashflow || 0,
            isOnFastTrack: (data as any).isOnFastTrack || false,
            numberOfChildren: (data as any).numberOfChildren || 0,
            income: incomeArray,
            expenses: expensesArray,
            assets: (data as any).assets || [],
            liabilities: (data as any).liabilities || [],
          }

          console.log('Transformed player data:', playerData)
          dispatch(setPlayerData(playerData))
        } catch (err) {
          console.error('Failed to update player in Redux store:', err)
        }
      },
    }),

    getAllPlayers: builder.query<{ players: any[] }, string>({
      query: (roomCode) => `/games/${roomCode}/players`,
      providesTags: ['AllPlayers'],
      async onQueryStarted(_roomCode, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          // Import setAllPlayers dynamically to avoid circular dependency
          const { setAllPlayers } = await import('@/store/slices/allPlayersSlice')

          // Transform backend response to PlayerSummary[]
          // Backend returns flat fields, not nested in financialData
          const playerSummaries = data.players.map((player: any) => ({
            id: player._id,
            name: player.playerName,
            profession: player.profession,
            cashOnHand: player.cashOnHand || 0,
            cashflow: player.cashflow || 0,
            paydayAmount: player.paydayAmount || 0,
            passiveIncome: player.passiveIncome || 0,
            totalExpenses: player.totalExpenses || 0,
            assetCount: player.assetCount || 0,
            isOnFastTrack: player.isOnFastTrack || false,
            connectionStatus: player.connectionStatus || 'connected',
            isReady: !!player.profession,
            isHost: player.isHost || false,
          }))

          dispatch(setAllPlayers(playerSummaries))
        } catch (err) {
          // Handle error if needed
          console.error('Failed to update players in Redux store:', err)
        }
      },
    }),

    collectPayday: builder.mutation<PlayerResponse, { roomCode: string; playerId: string }>({
      query: ({ roomCode, playerId }) => ({
        url: `/games/${roomCode}/players/${playerId}/payday`,
        method: 'POST',
      }),
      invalidatesTags: ['Player'],
    }),

    reconnectPlayer: builder.mutation<PlayerResponse, { roomCode: string; playerId: string }>({
      query: ({ roomCode, playerId }) => ({
        url: `/games/${roomCode}/players/${playerId}/reconnect`,
        method: 'POST',
      }),
      invalidatesTags: ['Player', 'GameSession'],
    }),

    reassignAuditor: builder.mutation<
      PlayerResponse,
      { roomCode: string; playerId: string; newAuditorPlayerId: string }
    >({
      query: ({ roomCode, playerId, newAuditorPlayerId }) => ({
        url: `/games/${roomCode}/players/${playerId}/auditor`,
        method: 'PATCH',
        body: { newAuditorPlayerId },
      }),
      invalidatesTags: ['Player'],
    }),

    // Market Event endpoint
    submitMarketEvent: builder.mutation<
      { message: string; transactionId: string; status: string; requiresLoan: boolean; impact: any },
      { roomCode: string; playerId: string; subType: string; amount?: number; fromPlayerId?: string; fromPlayerName?: string }
    >({
      query: ({ roomCode, playerId, subType, amount, fromPlayerId, fromPlayerName }) => ({
        url: `/games/${roomCode}/players/${playerId}/market-event`,
        method: 'POST',
        body: {
          type: 'market_event',
          subType,
          amount,
          fromPlayerId,
          fromPlayerName
        },
      }),
      invalidatesTags: ['Player', 'AllPlayers'],
      async onQueryStarted({ }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Force refetch player data immediately
          dispatch(gameApi.util.invalidateTags(['Player']))
        } catch {}
      },
    }),

    // Take Loan endpoint
    takeLoan: builder.mutation<
      PlayerResponse,
      { roomCode: string; playerId: string; amountIn1000s: number }
    >({
      query: ({ roomCode, playerId, amountIn1000s }) => ({
        url: `/games/${roomCode}/players/${playerId}/transactions/loan`,
        method: 'POST',
        body: {
          type: 'loan_take',
          amountIn1000s
        },
      }),
      invalidatesTags: ['Player', 'AllPlayers'],
    }),

    // Payoff Loan endpoint
    payoffLoan: builder.mutation<
      PlayerResponse,
      { roomCode: string; playerId: string; liabilityId: string; payoffAmount: number }
    >({
      query: ({ roomCode, playerId, liabilityId, payoffAmount }) => ({
        url: `/games/${roomCode}/players/${playerId}/transactions/payoff`,
        method: 'POST',
        body: { type: 'loan_payoff', liabilityId, payoffAmount },
      }),
      invalidatesTags: ['Player', 'AllPlayers'],
    }),
  }),
})

export const {
  useCreateGameMutation,
  useGetGameSessionQuery,
  useJoinGameMutation,
  useStartGameMutation,
  useSetupPlayerMutation,
  useGetPlayerQuery,
  useGetAllPlayersQuery,
  useCollectPaydayMutation,
  useReconnectPlayerMutation,
  useReassignAuditorMutation,
  useSubmitMarketEventMutation,
  useTakeLoanMutation,
  usePayoffLoanMutation,
} = gameApi