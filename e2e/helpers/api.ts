import type { APIRequestContext } from '@playwright/test'
import { expect } from '@playwright/test'

export const BACKEND_URL = 'http://localhost:3100'
const API = `${BACKEND_URL}/api`

export interface CreatedGame {
  roomCode: string
  gameSessionId: string
  hostPlayerId: string
  socketAuthToken: string
}

export interface JoinedPlayer {
  gameSessionId: string
  playerId: string
  roomCode: string
  socketAuthToken: string
}

export interface SetupOptions {
  profession?: string
  dream?: { name: string; cost: number }
  auditorPlayerId?: string
}

/**
 * Thin client for the backend REST API, used to arrange game state quickly
 * (create/join/setup/start) and to make backend-truth assertions that the
 * UI must agree with. All methods throw on unexpected status codes.
 */
export class GameApi {
  constructor(private request: APIRequestContext) {}

  private async post<T>(path: string, data?: unknown, okStatus = 201): Promise<T> {
    const res = await this.request.post(`${API}${path}`, { data })
    expect(res.status(), `POST ${path} → ${await res.text()}`).toBe(okStatus)
    return res.json() as Promise<T>
  }

  private async patch<T>(path: string, data?: unknown): Promise<T> {
    const res = await this.request.patch(`${API}${path}`, { data })
    expect(res.ok(), `PATCH ${path} → ${await res.text()}`).toBeTruthy()
    return res.json() as Promise<T>
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.request.get(`${API}${path}`)
    expect(res.ok(), `GET ${path} → ${await res.text()}`).toBeTruthy()
    return res.json() as Promise<T>
  }

  createGame(hostName: string): Promise<CreatedGame> {
    return this.post('/games', { hostName, gameVersion: 'cashflow_101' })
  }

  joinGame(roomCode: string, playerName: string): Promise<JoinedPlayer> {
    return this.post(`/games/${roomCode}/join`, { playerName }, 200)
  }

  setupPlayer(roomCode: string, playerId: string, opts: SetupOptions = {}): Promise<unknown> {
    return this.post(
      `/games/${roomCode}/players/${playerId}/setup`,
      {
        profession: opts.profession ?? 'secretary',
        dream: opts.dream ?? { name: 'Buy a Forest', cost: 250000 },
        ...(opts.auditorPlayerId ? { auditorPlayerId: opts.auditorPlayerId } : {}),
      },
      200,
    )
  }

  startGame(roomCode: string, hostPlayerId: string): Promise<unknown> {
    return this.patch(`/games/${roomCode}/start`, { playerId: hostPlayerId })
  }

  getSession(roomCode: string): Promise<any> {
    return this.get(`/games/${roomCode}`)
  }

  getPlayer(roomCode: string, playerId: string): Promise<any> {
    return this.get(`/games/${roomCode}/players/${playerId}`)
  }

  async getPlayers(roomCode: string): Promise<any[]> {
    const body = await this.get<{ players: any[] }>(`/games/${roomCode}/players`)
    return body.players
  }

  async getTransactions(
    roomCode: string,
    params: Record<string, string> = {},
  ): Promise<any[]> {
    const qs = new URLSearchParams(params).toString()
    const body = await this.get<{ transactions: any[] }>(
      `/games/${roomCode}/transactions${qs ? `?${qs}` : ''}`,
    )
    return body.transactions
  }

  reassignAuditor(roomCode: string, playerId: string, newAuditorPlayerId: string): Promise<unknown> {
    return this.patch(`/games/${roomCode}/players/${playerId}/auditor`, { newAuditorPlayerId })
  }

  /** Approve or reject a pending transaction as the given auditor. */
  audit(
    roomCode: string,
    txId: string,
    auditorId: string,
    action: 'approve' | 'reject',
    note?: string,
  ): Promise<unknown> {
    return this.patch(
      `/games/${roomCode}/transactions/${txId}/audit?auditorId=${auditorId}`,
      { action, ...(note ? { note } : {}) },
    )
  }

  submitBuyStock(
    roomCode: string,
    playerId: string,
    details: { symbol: string; pricePerShare: number; shares: number; dividendPerShare?: number },
  ): Promise<any> {
    return this.post(`/games/${roomCode}/players/${playerId}/transactions`, {
      type: 'buy',
      subType: 'stock',
      stockName: details.symbol,
      pricePerShare: details.pricePerShare,
      numShares: details.shares,
      dividendPerShare: details.dividendPerShare ?? 0,
    })
  }

  /** amountIn1000s: e.g. 2 borrows $2,000. */
  takeLoan(roomCode: string, playerId: string, amountIn1000s: number): Promise<any> {
    return this.post(`/games/${roomCode}/players/${playerId}/transactions/loan`, {
      type: 'loan_take',
      amountIn1000s,
    })
  }
}
