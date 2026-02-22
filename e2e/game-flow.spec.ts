import { test, expect } from '@playwright/test'

/**
 * Critical E2E Test: Game Creation and Join Flow
 * Tests the core flow of creating a game and joining as players
 */
test.describe('Game Creation and Join Flow', () => {
  test('should create a game and allow player to join', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/')

    // Verify landing page loaded
    await expect(page).toHaveTitle(/Cashflow/i)

    // Click "Create Game" button
    await page.getByRole('button', { name: /create game/i }).click()

    // Fill in host name
    await page.getByLabel(/your name/i).fill('Test Player 1')

    // Start game (creates room)
    await page.getByRole('button', { name: /create game/i }).click()

    // Should redirect to lobby with room code visible
    await expect(page).toHaveURL(/\/game\/[A-Z0-9]+\/lobby/)

    // Verify room code is displayed
    const roomCodeElement = page.locator('[data-testid="room-code"]').or(page.getByText(/room code/i).locator('..'))
    await expect(roomCodeElement).toBeVisible()
  })

  test('should allow second player to join existing game', async ({ page, context }) => {
    // First, create a game as host
    const hostPage = await context.newPage()
    await hostPage.goto('/')
    await hostPage.getByRole('button', { name: /create game/i }).click()
    await hostPage.getByLabel(/your name/i).fill('Host Player')
    await hostPage.getByRole('button', { name: /create game/i }).click()

    // Extract room code from host's lobby page
    await hostPage.waitForURL(/\/game\/[A-Z0-9]+\/lobby/)
    const url = hostPage.url()
    const roomCode = url.match(/\/game\/([A-Z0-9]+)\//)?.[1]

    expect(roomCode).toBeTruthy()

    // Now join as second player
    await page.goto('/')
    await page.getByRole('button', { name: /join game/i }).click()

    // Fill in join form
    await page.getByLabel(/room code/i).fill(roomCode!)
    await page.getByLabel(/your name/i).fill('Test Player 2')
    await page.getByRole('button', { name: /join/i }).click()

    // Should redirect to lobby
    await expect(page).toHaveURL(new RegExp(`/game/${roomCode}/lobby`))

    // Host should see the second player joined
    await expect(hostPage.getByText(/Test Player 2/i)).toBeVisible({ timeout: 5000 })

    // Close host page
    await hostPage.close()
  })

  test('should show error for invalid room code', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /join game/i }).click()

    // Try to join with invalid room code
    await page.getByLabel(/room code/i).fill('INVALID')
    await page.getByLabel(/your name/i).fill('Test Player')
    await page.getByRole('button', { name: /join/i }).click()

    // Should show error message
    await expect(page.getByText(/not found|invalid/i)).toBeVisible({ timeout: 5000 })
  })
})

/**
 * Critical E2E Test: Player Setup Flow
 */
test.describe('Player Setup Flow', () => {
  test('should complete player setup with profession and dream selection', async ({ page }) => {
    // Create game and navigate to lobby
    await page.goto('/')
    await page.getByRole('button', { name: /create game/i }).click()
    await page.getByLabel(/your name/i).fill('Setup Test Player')
    await page.getByRole('button', { name: /create game/i }).click()

    // Navigate to setup (assuming a "Setup" or "Start" button in lobby)
    const setupButton = page.getByRole('button', { name: /setup|start/i })
    if (await setupButton.isVisible({ timeout: 2000 })) {
      await setupButton.click()
    } else {
      // Manually navigate to setup if button not found
      const url = page.url()
      const roomCode = url.match(/\/game\/([A-Z0-9]+)\//)?.[1]
      await page.goto(`/game/${roomCode}/setup`)
    }

    // Should be on setup page
    await expect(page).toHaveURL(/\/game\/[A-Z0-9]+\/setup/)

    // Select a profession
    await page.getByRole('button', { name: /engineer|teacher|mechanic/i }).first().click()

    // Proceed to dream selection
    await page.getByRole('button', { name: /next|continue/i }).click()

    // Select a dream
    await page.getByRole('button', { name: /travel|buy|build/i }).first().click()

    // Complete setup
    const completeButton = page.getByRole('button', { name: /complete|finish|done/i })
    if (await completeButton.isVisible({ timeout: 2000 })) {
      await completeButton.click()
    }

    // Should redirect to dashboard or game screen
    await expect(page).toHaveURL(/\/game\/[A-Z0-9]+\/(dashboard|game)/)
  })
})
