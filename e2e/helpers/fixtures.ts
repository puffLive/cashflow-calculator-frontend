import { test as base, expect, type Browser, type Page } from '@playwright/test'
import { GameApi } from './api'

export interface PlayerHandle {
  page: Page
  playerId: string
  playerName: string
  socketAuthToken: string
}

export interface TwoPlayerGame {
  roomCode: string
  host: PlayerHandle
  p2: PlayerHandle
}

/**
 * Write the session credentials the app keeps in sessionStorage, then load
 * the given route. This is the fast path used to drop a page straight into
 * an already-arranged game (created via the REST API).
 */
export async function adoptSession(
  page: Page,
  creds: { roomCode: string; playerId: string; playerName: string; socketAuthToken: string },
  path: string,
): Promise<void> {
  await page.addInitScript((c) => {
    sessionStorage.setItem('roomCode', c.roomCode)
    sessionStorage.setItem('playerId', c.playerId)
    sessionStorage.setItem('playerName', c.playerName)
    sessionStorage.setItem('socketAuthToken', c.socketAuthToken)
    sessionStorage.setItem('playerSetupComplete', 'true')
    sessionStorage.setItem('isPlayerReady', 'true')
  }, creds)
  await page.goto(path)
}

/**
 * Arrange a started 2-player game entirely via the API, then open one page
 * per player on the dashboard. Host is a Secretary, P2 a Teacher; each is
 * the other's auditor.
 */
export async function arrangeTwoPlayerGame(
  browser: Browser,
  api: GameApi,
  opts: { hostName?: string; p2Name?: string } = {},
): Promise<TwoPlayerGame & { dispose: () => Promise<void> }> {
  const hostName = opts.hostName ?? 'Host Player'
  const p2Name = opts.p2Name ?? 'Second Player'

  const created = await api.createGame(hostName)
  const joined = await api.joinGame(created.roomCode, p2Name)

  await api.setupPlayer(created.roomCode, created.hostPlayerId, {
    profession: 'secretary',
    auditorPlayerId: joined.playerId,
  })
  await api.setupPlayer(created.roomCode, joined.playerId, {
    profession: 'teacher',
    dream: { name: 'Yacht Racing', cost: 150000 },
    auditorPlayerId: created.hostPlayerId,
  })
  await api.startGame(created.roomCode, created.hostPlayerId)

  const hostContext = await browser.newContext()
  const p2Context = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const p2Page = await p2Context.newPage()

  const dashboard = `/game/${created.roomCode}/dashboard`
  await adoptSession(
    hostPage,
    {
      roomCode: created.roomCode,
      playerId: created.hostPlayerId,
      playerName: hostName,
      socketAuthToken: created.socketAuthToken,
    },
    dashboard,
  )
  await adoptSession(
    p2Page,
    {
      roomCode: created.roomCode,
      playerId: joined.playerId,
      playerName: p2Name,
      socketAuthToken: joined.socketAuthToken,
    },
    dashboard,
  )
  await expect(hostPage.getByText('Financial Overview')).toBeVisible({ timeout: 15_000 })
  await expect(p2Page.getByText('Financial Overview')).toBeVisible({ timeout: 15_000 })

  return {
    roomCode: created.roomCode,
    host: {
      page: hostPage,
      playerId: created.hostPlayerId,
      playerName: hostName,
      socketAuthToken: created.socketAuthToken,
    },
    p2: {
      page: p2Page,
      playerId: joined.playerId,
      playerName: p2Name,
      socketAuthToken: joined.socketAuthToken,
    },
    dispose: async () => {
      await hostContext.close()
      await p2Context.close()
    },
  }
}

interface Fixtures {
  api: GameApi
  /** A started 2-player game with both dashboards open. */
  game: TwoPlayerGame
}

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new GameApi(request))
  },
  game: async ({ browser, api }, use) => {
    const arranged = await arrangeTwoPlayerGame(browser, api)
    await use(arranged)
    await arranged.dispose()
  },
})

export { expect }
