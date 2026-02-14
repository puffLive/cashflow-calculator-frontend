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

    startGame: builder.mutation<GameSession, string>({
      query: (roomCode) => ({
        url: `/games/${roomCode}/start`,
        method: 'PATCH',
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

    getPlayer: builder.query<Player, { roomCode: string; playerId: string }>({
      query: ({ roomCode, playerId }) => `/games/${roomCode}/players/${playerId}`,
      providesTags: ['Player'],
    }),

    getAllPlayers: builder.query<{ players: Player[] }, string>({
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
} = gameApi