import { test, expect } from './helpers/fixtures'

/**
 * Cross-player realtime sync: players overview, activity feed, and
 * disconnect/reconnect visibility.
 */

test.describe('Players overview', () => {
  test('shows every player with cash and payday figures', async ({ game, api }) => {
    const players = await api.getPlayers(game.roomCode)
    const { page } = game.p2
    await page.getByRole('button', { name: 'Players', exact: true }).click()
    await expect(page).toHaveURL(/\/players$/)

    for (const p of players) {
      await expect(page.getByText(p.playerName).first()).toBeVisible()
    }
  })

  test('observer sees a peer purchase after audit approval', async ({ game, api }) => {
    const { page: p2Page } = game.p2
    await p2Page.getByRole('button', { name: 'Players', exact: true }).click()

    const before = await api.getPlayer(game.roomCode, game.host.playerId)

    // Host buys via API; P2 (auditor) approves via API — pure sync test.
    const tx = await api.submitBuyStock(game.roomCode, game.host.playerId, {
      symbol: 'GRO4US',
      pricePerShare: 25,
      shares: 4,
    })
    const txId = tx.transactionId ?? tx._id ?? tx.transaction?._id
    await api.audit(game.roomCode, String(txId), game.p2.playerId, 'approve')

    // P2's overview shows host cash reduced by $100 (socket push or poll)
    const expected = (before.cashOnHand - 100).toLocaleString('en-US')
    await expect(p2Page.getByText(`$${expected}`).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Disconnect / reconnect', () => {
  test('peers see a player go offline and come back', async ({ game, api, browser }) => {
    // P2 drops: closing the page severs the socket
    await game.p2.page.close()

    await expect
      .poll(
        async () => {
          const players = await api.getPlayers(game.roomCode)
          return players.find((p: any) => p.playerName === game.p2.playerName)?.connectionStatus
        },
        { timeout: 20_000 },
      )
      .toBe('disconnected')

    // Reconnect: a fresh context adopting the same session credentials
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.addInitScript((c) => {
      sessionStorage.setItem('roomCode', c.roomCode)
      sessionStorage.setItem('playerId', c.playerId)
      sessionStorage.setItem('playerName', c.playerName)
      sessionStorage.setItem('socketAuthToken', c.socketAuthToken)
      sessionStorage.setItem('playerSetupComplete', 'true')
      sessionStorage.setItem('isPlayerReady', 'true')
    }, {
      roomCode: game.roomCode,
      playerId: game.p2.playerId,
      playerName: game.p2.playerName,
      socketAuthToken: game.p2.socketAuthToken,
    })
    // Land on '/' so the ReconnectionHandler picks up the stored session and
    // calls the reconnect endpoint (the only code path that flips
    // connectionStatus back to 'connected' — a bare socket re-join does not).
    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 })

    await expect
      .poll(
        async () => {
          const players = await api.getPlayers(game.roomCode)
          return players.find((p: any) => p.playerName === game.p2.playerName)?.connectionStatus
        },
        { timeout: 20_000 },
      )
      .toBe('connected')

    await context.close()
  })

  test('reloading mid-game must not leave the player marked disconnected', async ({
    game,
    api,
  }) => {
    // Regression lock: join:room used to update socketId without restoring
    // connectionStatus, so a mid-game reload left the player 'disconnected'
    // in the DB (and eligible for inactivity removal while playing). An
    // authenticated socket re-join now restores connected status.
    await game.p2.page.reload()
    await expect(game.p2.page.getByText('Financial Overview')).toBeVisible({ timeout: 15_000 })

    await expect
      .poll(
        async () => {
          const players = await api.getPlayers(game.roomCode)
          return players.find((p: any) => p.playerName === game.p2.playerName)?.connectionStatus
        },
        { timeout: 15_000 },
      )
      .toBe('connected')
  })
})
