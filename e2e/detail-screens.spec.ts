import { test, expect } from './helpers/fixtures'

/**
 * Detail screens: income, expenses, assets, liabilities, transaction history.
 * Arranged with an approved stock purchase so there is data to display.
 */

test.describe('Detail screens', () => {
  test.beforeEach(async ({ game, api }) => {
    const tx = await api.submitBuyStock(game.roomCode, game.host.playerId, {
      symbol: 'OK4U',
      pricePerShare: 10,
      shares: 10,
      dividendPerShare: 1,
    })
    const txId = tx.transactionId ?? tx._id ?? tx.transaction?._id
    await api.audit(game.roomCode, String(txId), game.p2.playerId, 'approve')
    await game.host.page.reload()
  })

  test('income screen lists salary and dividend passive income', async ({ game, api }) => {
    const backend = await api.getPlayer(game.roomCode, game.host.playerId)
    const { page } = game.host
    await page.getByRole('button', { name: 'Income', exact: true }).click()
    await expect(page).toHaveURL(/\/income$/)
    await expect(page.getByText(`$${backend.salary.toLocaleString()}`).first()).toBeVisible()
    // 10 shares × $1 dividend = $10/month passive income
    await expect(page.getByText(/OK4U/).first()).toBeVisible()
  })

  test('expense screen totals match the backend', async ({ game, api }) => {
    const backend = await api.getPlayer(game.roomCode, game.host.playerId)
    const { page } = game.host
    await page.getByRole('button', { name: 'Expenses', exact: true }).click()
    await expect(page).toHaveURL(/\/expenses$/)
    await expect(
      page.getByText(`$${backend.totalExpenses.toLocaleString()}`).first(),
    ).toBeVisible()
  })

  test('assets screen shows the owned stock', async ({ game }) => {
    const { page } = game.host
    await page.getByRole('button', { name: 'Assets', exact: true }).click()
    await expect(page).toHaveURL(/\/assets$/)
    await expect(page.getByText(/OK4U/).first()).toBeVisible()
  })

  test('liabilities screen lists the profession starting debts', async ({ game, api }) => {
    const backend = await api.getPlayer(game.roomCode, game.host.playerId)
    const { page } = game.host
    // Liabilities is reachable via the dashboard tab overflow or direct URL
    await page.goto(`/game/${game.roomCode}/liabilities`)
    for (const liability of backend.liabilities) {
      await expect(page.getByText(liability.name).first()).toBeVisible()
    }
  })

  test('transaction history shows the approved purchase', async ({ game }) => {
    // Regression lock: this screen used to crash the whole app (blank white
    // page) on any buy/sell row by reading tx.details.assetType, which the
    // API never sends. Transactions are now normalized in transactionApi.
    const { page } = game.host
    await page.goto(`/game/${game.roomCode}/history`)
    await expect(page.getByText(/OK4U|Bought/).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/approved/i).first()).toBeVisible()
  })
})
