import { test, expect } from './helpers/fixtures'
import { readMetric } from './helpers/ui'

/**
 * Dashboard metrics and the PAYDAY collection flow.
 * Uses the API-arranged 2-player game fixture (host = Secretary, p2 = Teacher).
 */

test.describe('Dashboard', () => {
  test('financial overview matches the backend player record @mobile', async ({ game, api }) => {
    const backend = await api.getPlayer(game.roomCode, game.host.playerId)
    const { page } = game.host

    expect(await readMetric(page, 'Cash on Hand')).toBe(backend.cashOnHand)
    expect(await readMetric(page, 'Passive Income')).toBe(backend.passiveIncome)
    expect(await readMetric(page, 'Expenses')).toBe(backend.totalExpenses)
    expect(await readMetric(page, 'Total Income')).toBe(backend.totalIncome)
    expect(await readMetric(page, 'PAYDAY')).toBe(backend.paydayAmount)
  })

  test('shows all six transaction actions', async ({ game }) => {
    const { page } = game.host
    for (const action of ['Buy Asset', 'Sell Asset', 'Take Loan', 'Market', 'Pay', 'Collect']) {
      await expect(page.getByRole('button', { name: action, exact: true })).toBeVisible()
    }
  })

  test('fast track progress reflects passive income vs expenses', async ({ game, api }) => {
    const backend = await api.getPlayer(game.roomCode, game.host.playerId)
    const { page } = game.host
    await expect(page.getByText('Progress to Fast Track')).toBeVisible()
    await expect(
      page.getByText(
        `$${backend.passiveIncome.toLocaleString()} / $${backend.totalExpenses.toLocaleString()}`,
      ),
    ).toBeVisible()
  })
})

test.describe('PAYDAY collection', () => {
  test('collecting PAYDAY adds the payday amount to cash, no audit needed', async ({
    game,
    api,
  }) => {
    const { page } = game.host
    const before = await api.getPlayer(game.roomCode, game.host.playerId)

    await page.getByRole('button', { name: 'Collect', exact: true }).click()
    await expect(page).toHaveURL(/\/transaction\/collect$/)

    // Type cards are clickable divs; the confirm button on step 3 shares the
    // same label, so scope to the card first.
    await page.getByText('Collect your monthly PAYDAY').click()
    await page.getByRole('button', { name: /^next$/i }).click()

    await page.getByRole('button', { name: /^collect payday$/i }).click()
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 })

    // Backend truth: cash increased by exactly the payday amount
    await expect
      .poll(async () => (await api.getPlayer(game.roomCode, game.host.playerId)).cashOnHand, {
        timeout: 10_000,
      })
      .toBe(before.cashOnHand + before.paydayAmount)

    // And the dashboard shows it
    await expect
      .poll(() => readMetric(page, 'Cash on Hand'), { timeout: 10_000 })
      .toBe(before.cashOnHand + before.paydayAmount)

    // PAYDAY must not enter the audit queue
    const paydays = await api.getTransactions(game.roomCode, {
      playerId: game.host.playerId,
      type: 'payday',
    })
    expect(paydays.length).toBeGreaterThan(0)
    expect(paydays[0].auditStatus).not.toBe('pending')
  })

  test('other players see the payday reflected in the players overview', async ({ game, api }) => {
    const before = await api.getPlayer(game.roomCode, game.host.playerId)

    // Host collects payday (via API to keep this test focused on the sync)
    const { page: hostPage } = game.host
    await hostPage.getByRole('button', { name: 'Collect', exact: true }).click()
    await hostPage.getByText('Collect your monthly PAYDAY').click()
    await hostPage.getByRole('button', { name: /^next$/i }).click()
    await hostPage.getByRole('button', { name: /^collect payday$/i }).click()

    // P2 opens the players overview and sees host's updated cash
    const { page: p2Page } = game.p2
    await p2Page.getByRole('button', { name: 'Players', exact: true }).click()
    await expect(p2Page).toHaveURL(/\/players$/)
    const expected = (before.cashOnHand + before.paydayAmount).toLocaleString('en-US')
    await expect(p2Page.getByText(`$${expected}`).first()).toBeVisible({ timeout: 15_000 })
  })
})
