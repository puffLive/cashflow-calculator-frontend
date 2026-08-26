import { test, expect } from './helpers/fixtures'
import { createGameViaUI, joinGameViaUI } from './helpers/ui'

/**
 * Entry flows: landing page, game creation, joining, and route guards.
 * Tagged @mobile where the flow is part of the mobile-first happy path.
 */

test.describe('Landing page', () => {
  test('shows title and both entry actions @mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/cashflow/i)
    await expect(page.getByRole('button', { name: /create new game/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /join existing game/i })).toBeVisible()
  })

  test('unknown routes render the not-found page', async ({ page }) => {
    await page.goto('/definitely/not/a/route')
    await expect(page.getByText(/not found|404/i).first()).toBeVisible()
  })

  test('malformed game URLs bounce back to the landing page', async ({ page }) => {
    await page.goto('/game/bad!!/dashboard')
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('Create game', () => {
  test('create button is disabled until a name is entered', async ({ page }) => {
    await page.goto('/create')
    await expect(page.getByRole('button', { name: /^create game$/i })).toBeDisabled()
    await page.getByLabel(/your name/i).fill('Ada')
    await expect(page.getByRole('button', { name: /^create game$/i })).toBeEnabled()
  })

  test('creates a game and shows a shareable room code @mobile', async ({ page, api }) => {
    const roomCode = await createGameViaUI(page, 'Create Flow Host')
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/)
    // Room codes must avoid ambiguous characters (0/O, 1/I/l)
    expect(roomCode).not.toMatch(/[01OI]/)

    // Backend agrees the session exists and is in the lobby
    const session = await api.getSession(roomCode)
    expect(session.status).toBe('lobby')

    // The success screen offers the next step
    await expect(page.getByRole('button', { name: /set up your player/i })).toBeVisible()
  })

  test('proceeds from the success screen into player setup', async ({ page }) => {
    const roomCode = await createGameViaUI(page, 'Setup Bound Host')
    await page.getByRole('button', { name: /set up your player/i }).click()
    await expect(page).toHaveURL(new RegExp(`/game/${roomCode}/setup`))
  })
})

test.describe('Join game', () => {
  test('rejects an unknown room code with a visible error @mobile', async ({ page }) => {
    await page.goto('/join')
    await page.getByPlaceholder('Enter 6-character code').fill('ZZZZZZ')
    await page.getByPlaceholder('Enter your name').fill('Nobody')
    await page.getByRole('button', { name: /join game/i }).click()
    await expect(page.getByText(/not found|invalid|no game/i).first()).toBeVisible()
    await expect(page).toHaveURL(/\/join$/)
  })

  test('joins an existing game and lands in setup', async ({ page, api }) => {
    const created = await api.createGame('Join Flow Host')
    await joinGameViaUI(page, created.roomCode, 'Join Flow P2')

    const players = await api.getPlayers(created.roomCode)
    expect(players.map((p) => p.playerName)).toContain('Join Flow P2')
  })

  test('room codes are case-insensitive', async ({ page, api }) => {
    const created = await api.createGame('Case Host')
    await page.goto('/join')
    await page.getByPlaceholder('Enter 6-character code').fill(created.roomCode.toLowerCase())
    await page.getByPlaceholder('Enter your name').fill('Lower Case Larry')
    await page.getByRole('button', { name: /join game/i }).click()
    await expect(page).toHaveURL(new RegExp(`/game/${created.roomCode}/setup`, 'i'), {
      timeout: 15_000,
    })
  })

  test('a 7th player cannot join a full game', async ({ page, api }) => {
    const created = await api.createGame('Full Game Host')
    for (let i = 2; i <= 6; i++) {
      await api.joinGame(created.roomCode, `Player ${i}`)
    }
    await page.goto('/join')
    await page.getByPlaceholder('Enter 6-character code').fill(created.roomCode)
    await page.getByPlaceholder('Enter your name').fill('Player 7')
    await page.getByRole('button', { name: /join game/i }).click()
    await expect(page.getByText(/full|maximum|6 players/i).first()).toBeVisible()
  })
})
