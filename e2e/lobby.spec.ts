import { test, expect } from './helpers/fixtures'
import { adoptSession } from './helpers/fixtures'
import { createGameViaUI, completeSetupViaUI, startGameViaUI } from './helpers/ui'

/**
 * Game lobby: player roster, realtime join updates, and starting the game.
 */

test.describe('Lobby', () => {
  test('shows the room code and player count', async ({ page }) => {
    const roomCode = await createGameViaUI(page, 'Lobby Host')
    await page.getByRole('button', { name: /set up your player/i }).click()
    await completeSetupViaUI(page)

    await expect(page.getByText(roomCode)).toBeVisible()
    await expect(page.getByText(/players \(1\/6\)/i)).toBeVisible()
    await expect(page.getByText('Lobby Host')).toBeVisible()
  })

  test('host sees a newly joined player in real time', async ({ page, api }) => {
    const roomCode = await createGameViaUI(page, 'Realtime Host')
    await page.getByRole('button', { name: /set up your player/i }).click()
    await completeSetupViaUI(page)
    await expect(page.getByText(/players \(1\/6\)/i)).toBeVisible()

    await api.joinGame(roomCode, 'Late Joiner')

    // Socket event (or the lobby poll) must surface the new player
    // (.first(): the join also fires an activity toast naming the player)
    await expect(page.getByText('Late Joiner').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/players \(2\/6\)/i)).toBeVisible({ timeout: 15_000 })
  })

  test('solo host cannot start the game — server refusal is surfaced', async ({ page }) => {
    await createGameViaUI(page, 'Solo Host')
    await page.getByRole('button', { name: /set up your player/i }).click()
    await completeSetupViaUI(page)

    const start = page.getByRole('button', { name: /^start game$/i })
    // KNOWN ISSUE: the lobby currently tells a solo host "You can start the
    // game now" and enables the button, but the backend requires 2+ players.
    // We pin the minimum acceptable behavior: clicking must not navigate,
    // and some error feedback must appear.
    if (await start.isEnabled()) {
      await start.click()
      await expect(page).toHaveURL(/\/lobby$/)
      await expect(page.getByText(/failed|at least 2|not enough/i).first()).toBeVisible({
        timeout: 10_000,
      })
    } else {
      await expect(start).toBeDisabled()
    }
  })

  test('starting with 2 ready players moves everyone to the dashboard', async ({
    page,
    browser,
    api,
  }) => {
    const roomCode = await createGameViaUI(page, 'Starter Host')
    await page.getByRole('button', { name: /set up your player/i }).click()
    await completeSetupViaUI(page)

    // Second player arranged via API, lobby page opened for them
    const joined = await api.joinGame(roomCode, 'Second Ready')
    await api.setupPlayer(roomCode, joined.playerId, {
      profession: 'teacher',
      auditorPlayerId: undefined,
    })
    const p2Context = await browser.newContext()
    const p2Page = await p2Context.newPage()
    await adoptSession(
      p2Page,
      {
        roomCode,
        playerId: joined.playerId,
        playerName: 'Second Ready',
        socketAuthToken: joined.socketAuthToken,
      },
      `/game/${roomCode}/lobby`,
    )
    await expect(p2Page.getByText(/players \(2\/6\)/i)).toBeVisible({ timeout: 15_000 })

    // Host (created via UI, so Redux host state is live) starts the game
    await startGameViaUI(page)

    // The other player is pushed to the dashboard by the game:started event
    await expect(p2Page).toHaveURL(/\/dashboard$/, { timeout: 15_000 })

    const session = await api.getSession(roomCode)
    expect(session.status).toBe('active')
    await p2Context.close()
  })
})
