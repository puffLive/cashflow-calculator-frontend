import { test, expect } from '@playwright/test'

/**
 * E2E specs for the player-setup wizard (Feature 15.3.1–15.3.2).
 * Skipped pending CI backend wiring.
 */

test.describe('Player Setup Wizard (15.3)', () => {
  test.skip('15.3.1 — full wizard (profession → dream → auditor → confirm) lands the player in "Ready"', async ({
    page,
    context,
  }) => {
    // Need at least two players in the session for auditor selection.
    const hostPage = page
    await hostPage.goto('/create')
    await hostPage.getByLabel(/your name/i).fill('Host')
    await hostPage.getByRole('button', { name: /create game/i }).click()
    const roomCode = await hostPage
      .locator('p.font-mono.font-bold')
      .first()
      .innerText()

    const joinerPage = await context.newPage()
    await joinerPage.goto('/join')
    await joinerPage.getByLabel(/room code/i).fill(roomCode)
    await joinerPage.getByLabel(/your name/i).fill('Joiner')
    await joinerPage.getByRole('button', { name: /join game/i }).click()

    // Host walks the wizard
    await hostPage.getByRole('button', { name: /set up your player/i }).click()

    // Step 1: profession
    await hostPage.getByText(/engineer/i).click()
    await hostPage.getByRole('button', { name: /next/i }).click()

    // Step 2: dream
    await hostPage.getByText(/buy a forest/i).click()
    await hostPage.getByRole('button', { name: /next/i }).click()

    // Step 3: auditor — Joiner is the only other player so auto-selected
    await hostPage.getByRole('button', { name: /next/i }).click()

    // Step 4: review + confirm
    await hostPage.getByRole('button', { name: /confirm/i }).click()

    // After setup, host returns to lobby with "Ready" badge
    await expect(hostPage.getByText(/ready/i)).toBeVisible()

    await joinerPage.close()
  })

  test.skip('15.3.2 — profession selection populates correct starting financial data', async ({
    page,
    context,
  }) => {
    // Pick Engineer; verify the review screen shows engineer's starting cash,
    // salary, and total expenses (which match the values in @cashflow/shared).
    const hostPage = page
    // ... two-player setup ...

    await hostPage.getByText(/engineer/i).click()
    await hostPage.getByRole('button', { name: /next/i }).click()
    // ... pick dream + auditor, advance to review ...

    // Engineer in shared data: salary 4900, savings 400, expenses sum 2710
    await expect(hostPage.getByText(/\$4,900/)).toBeVisible() // salary
    await expect(hostPage.getByText(/\$400/)).toBeVisible() // starting cash
    await expect(hostPage.getByText(/\$2,710/)).toBeVisible() // total expenses

    // PAYDAY = 4900 - 2710 = 2190
    await expect(hostPage.getByText(/\$2,190/)).toBeVisible()
  })
})
