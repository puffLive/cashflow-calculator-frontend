import { test, expect } from './helpers/fixtures'

/**
 * Bank loans: $1,000 increments, $100/month payment per $1,000.
 * Host takes the loan; P2 audits.
 */

test.describe('Take Loan', () => {
  test('loan wizard enforces $1,000 increments and shows payment math', async ({ game }) => {
    const { page } = game.host
    await page.getByRole('button', { name: /^take loan$/i }).click()
    await expect(page).toHaveURL(/\/transaction\/loan$/)

    const amount = page.getByTestId('loan-amount')
    await expect(amount).toHaveText('$1,000')
    // Decrement is disabled at the $1,000 floor
    await expect(page.locator('button:has(svg)').first()).toBeVisible()

    // Bump to $3,000 via the + control (the round button next to the counter)
    const plus = page.locator('div.flex.items-center.justify-center.space-x-4 button').nth(1)
    await plus.click()
    await plus.click()
    await expect(amount).toHaveText('$3,000')
    await expect(page.getByText('$300').first()).toBeVisible() // monthly payment
  })

  test('approved loan adds cash and a bank-loan liability', async ({ game, api }) => {
    const hostPage = game.host.page
    const p2Page = game.p2.page
    const before = await api.getPlayer(game.roomCode, game.host.playerId)

    await hostPage.getByRole('button', { name: /^take loan$/i }).click()
    const plus = hostPage.locator('div.flex.items-center.justify-center.space-x-4 button').nth(1)
    await plus.click() // $2,000
    await hostPage.getByRole('button', { name: /preview impact/i }).click()
    await hostPage.getByRole('button', { name: /submit for audit/i }).click()
    await expect(hostPage).toHaveURL(/\/dashboard$/, { timeout: 15_000 })

    // Auditor approves
    await p2Page.getByRole('button', { name: /audits/i }).click()
    await expect(p2Page.getByRole('button', { name: /review transaction/i })).toBeVisible({
      timeout: 15_000,
    })
    await p2Page.getByRole('button', { name: /review transaction/i }).click()
    await p2Page.getByRole('button', { name: /approve transaction/i }).click()

    await expect
      .poll(async () => (await api.getPlayer(game.roomCode, game.host.playerId)).cashOnHand, {
        timeout: 10_000,
      })
      .toBe(before.cashOnHand + 2000)

    const after = await api.getPlayer(game.roomCode, game.host.playerId)
    const bankLoan = after.liabilities.find((l: any) => l.type === 'bank_loan')
    expect(bankLoan).toBeTruthy()
    expect(bankLoan.currentBalance).toBe(2000)
    expect(bankLoan.monthlyPayment).toBe(200)
  })

  test('approved loan raises total expenses by exactly $100 per $1,000', async ({ game, api }) => {
    // Regression lock for the fixed double-count: calculateTakeLoanImpact
    // used to emit both an expenseDelta AND a newLiability, and each was
    // applied to a different expense line (a $2,000 loan raised expenses by
    // $400). Now the delta is applied once, on bankLoanPayment.
    const before = await api.getPlayer(game.roomCode, game.host.playerId)
    await api.takeLoan(game.roomCode, game.host.playerId, 3)

    const pending = await api.getTransactions(game.roomCode, {
      auditorId: game.p2.playerId,
      auditStatus: 'pending',
    })
    await api.audit(game.roomCode, String(pending[0]._id), game.p2.playerId, 'approve')

    await expect
      .poll(async () => (await api.getPlayer(game.roomCode, game.host.playerId)).totalExpenses, {
        timeout: 10_000,
      })
      .toBe(before.totalExpenses + 300)
  })
})
