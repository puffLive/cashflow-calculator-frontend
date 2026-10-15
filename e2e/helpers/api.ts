import type { APIRequestContext, Page } from '@playwright/test'
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
  /** Credentials issued by createGame / joinGame, by player id. */
  private tokens = new Map<string, string>()
  /** Players this client created or joined, by room code. */
  private roomPlayers = new Map<string, string[]>()

  constructor(private request: APIRequestContext) {}

  /** Remember a player's credentials (also for players created through the UI). */
  remember(roomCode: string, playerId: string, socketAuthToken: string): void {
    this.tokens.set(playerId, socketAuthToken)
    const players = this.roomPlayers.get(roomCode) ?? []
    if (!players.includes(playerId)) players.push(playerId)
    this.roomPlayers.set(roomCode, players)
  }

  /** Remember the credentials a page got from creating/joining through the UI. */
  async rememberFromPage(page: Page): Promise<void> {
    const creds = await page.evaluate(() => ({
      roomCode: sessionStorage.getItem('roomCode'),
      playerId: sessionStorage.getItem('playerId'),
      token: sessionStorage.getItem('socketAuthToken'),
    }))
    if (creds.roomCode && creds.playerId && creds.token) {
      this.remember(creds.roomCode, creds.playerId, creds.token)
    }
  }

  /** The headers the backend needs to act as `playerId`. */
  authHeaders(playerId: string): Record<string, string> {
    const token = this.tokens.get(playerId)
    return token ? { 'X-Player-Id': playerId, 'X-Player-Token': token } : {}
  }

  /** Headers for a read in `roomCode`: any player in the game may read. */
  private readHeaders(path: string): Record<string, string> {
    const roomCode = path.match(/^\/games\/([^/?]+)/)?.[1]
    const playerId = roomCode ? this.roomPlayers.get(roomCode)?.[0] : undefined
    return playerId ? this.authHeaders(playerId) : {}
  }

  private async post<T>(path: string, data?: unknown, okStatus = 201, as?: string): Promise<T> {
    const res = await this.request.post(`${API}${path}`, {
      data,
      headers: as ? this.authHeaders(as) : {},
    })
    expect(res.status(), `POST ${path} → ${await res.text()}`).toBe(okStatus)
    return res.json() as Promise<T>
  }

  private async patch<T>(path: string, data: unknown, as: string): Promise<T> {
    const res = await this.request.patch(`${API}${path}`, { data, headers: this.authHeaders(as) })
    expect(res.ok(), `PATCH ${path} → ${await res.text()}`).toBeTruthy()
    return res.json() as Promise<T>
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.request.get(`${API}${path}`, { headers: this.readHeaders(path) })
    expect(res.ok(), `GET ${path} → ${await res.text()}`).toBeTruthy()
    return res.json() as Promise<T>
  }

  async createGame(hostName: string): Promise<CreatedGame> {
    const created = await this.post<CreatedGame>('/games', {
      hostName,
      gameVersion: 'cashflow_101',
    })
    this.remember(created.roomCode, created.hostPlayerId, created.socketAuthToken)
    return created
  }

  async joinGame(roomCode: string, playerName: string): Promise<JoinedPlayer> {
    const joined = await this.post<JoinedPlayer>(`/games/${roomCode}/join`, { playerName }, 200)
    this.remember(roomCode, joined.playerId, joined.socketAuthToken)
    return joined
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
      playerId
    )
  }

  startGame(roomCode: string, hostPlayerId: string): Promise<unknown> {
    return this.patch(`/games/${roomCode}/start`, { playerId: hostPlayerId }, hostPlayerId)
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

  async getTransactions(roomCode: string, params: Record<string, string> = {}): Promise<any[]> {
    const qs = new URLSearchParams(params).toString()
    const body = await this.get<{ transactions: any[] }>(
      `/games/${roomCode}/transactions${qs ? `?${qs}` : ''}`
    )
    return body.transactions
  }

  reassignAuditor(
    roomCode: string,
    playerId: string,
    newAuditorPlayerId: string
  ): Promise<unknown> {
    return this.patch(
      `/games/${roomCode}/players/${playerId}/auditor`,
      { newAuditorPlayerId },
      playerId
    )
  }

  /** Approve or reject a pending transaction as the given auditor. */
  audit(
    roomCode: string,
    txId: string,
    auditorId: string,
    action: 'approve' | 'reject',
    note?: string
  ): Promise<unknown> {
    return this.patch(
      `/games/${roomCode}/transactions/${txId}/audit?auditorId=${auditorId}`,
      { action, ...(note ? { note } : {}) },
      auditorId
    )
  }

  submitBuyStock(
    roomCode: string,
    playerId: string,
    details: { symbol: string; pricePerShare: number; shares: number; dividendPerShare?: number }
  ): Promise<any> {
    return this.post(
      `/games/${roomCode}/players/${playerId}/transactions`,
      {
        type: 'buy',
        subType: 'stock',
        stockName: details.symbol,
        pricePerShare: details.pricePerShare,
        numShares: details.shares,
        dividendPerShare: details.dividendPerShare ?? 0,
      },
      201,
      playerId
    )
  }

  /** amountIn1000s: e.g. 2 borrows $2,000. */
  takeLoan(roomCode: string, playerId: string, amountIn1000s: number): Promise<any> {
    return this.post(
      `/games/${roomCode}/players/${playerId}/transactions/loan`,
      {
        type: 'loan_take',
        amountIn1000s,
      },
      201,
      playerId
    )
  }
}
