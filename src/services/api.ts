import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { openModal } from '@/store/slices/uiSlice'
import { clearSessionCredentials, getSocketAuth } from '@/utils/sessionAuth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

/**
 * Every game route except create/join/lookup/reconnect needs the player's
 * credentials (the same id + token the socket handshake uses). Sent on every
 * request when we have them; the backend ignores them on public routes.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const { playerId, socketAuthToken } = getSocketAuth()
    if (playerId && socketAuthToken) {
      headers.set('X-Player-Id', playerId)
      headers.set('X-Player-Token', socketAuthToken)
    }
    return headers
  },
})

/**
 * Wrap the standard fetch baseQuery so we can centrally handle a 410 Gone
 * response. The backend returns 410 from the `trackActivity` middleware on
 * any write call against an expired session (Feature 16.5.3 backend) — we
 * surface the existing SessionExpiredModal exactly once via the `ui.modalOpen`
 * slot, then clear the per-tab credentials so the user can't get stuck in a
 * loop of failing requests.
 */
const baseQueryWith410: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 410) {
    // Idempotent: the slice action just sets a string; opening the modal
    // twice is a no-op. The handleReturn inside SessionExpiredModal will
    // navigate to / and clear sessionStorage there as well — clearing
    // credentials here covers the case where the user dismisses the modal
    // without clicking the button.
    clearSessionCredentials()
    api.dispatch(openModal('session_expired'))
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWith410,
  tagTypes: ['GameSession', 'Player', 'AllPlayers', 'Transactions'],
  endpoints: () => ({}),
})

// Endpoints will be injected in separate files
