import { test, expect } from '@playwright/test'

/**
 * Critical E2E Test: Real-estate buy → audit approve → mortgage in totalExpenses.
 *
 * This is the locking test for backend bug 16.5.8 (mortgage was being silently
 * dropped from `totalExpenses` because the audit-approve path didn't copy the
 * shared lib's updated `expenses` sub-doc back onto the player document). The
 * regression test exists at the API level (`auditController.test.ts`); this
 * one pins the same behavior end-to-end through the frontend's dashboard.
 *
 * Skipped until CI has a backend wired up. The structure below is the
 * complete test plan — unskip when ready.
 */
test.describe('Real-estate buy → audit-approve → mortgage reflected in totalExpenses', () => {
  test.skip('mortgage payment shows up in totalExpenses after audit approval', async ({
    page,
    context,
  }) => {
    // ── Setup: two players, cross-linked auditors ───────────────────────
    const buyerPage = page
    const auditorPage = await context.newPage()

    // Buyer creates a game
    await buyerPage.goto('/create')
    await buyerPage.getByLabel(/your name/i).fill('Buyer')
    await buyerPage.getByRole('button', { name: /create game/i }).click()

    // Capture the room code
    const roomCode = await buyerPage
      .locator('p.font-mono.font-bold')
      .first()
      .innerText()
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/)

    // Auditor joins
    await auditorPage.goto('/join')
    await auditorPage.getByLabel(/room code/i).fill(roomCode)
    await auditorPage.getByLabel(/your name/i).fill('Auditor')
    await auditorPage.getByRole('button', { name: /join game/i }).click()

    // Both complete profession setup (assumes setup wizard accepts defaults)
    // ... setup flow (skipped — covered by 15.3.x) ...

    // Host starts the game; both navigate to dashboard
    await buyerPage.getByRole('button', { name: /start game/i }).click()

    // ── Capture the buyer's totalExpenses BEFORE the buy ────────────────
    await buyerPage.waitForURL(/\/game\/[A-Z0-9]+\/dashboard/)
    const expensesBefore = await readMetricValue(buyerPage, /total expenses/i)

    // ── Buy real estate ──────────────────────────────────────────────────
    await buyerPage.getByRole('button', { name: /\+|new transaction/i }).click()
    await buyerPage.getByRole('button', { name: /buy/i }).click()
    await buyerPage.getByText(/real estate/i).click()
    await buyerPage.getByRole('button', { name: /next/i }).click()

    // Fill the form: $50k property, $4k down, $46k mortgage, $230/mo, $350/mo rent
    await buyerPage.getByLabel(/property name/i).fill('3/2 Rental')
    await buyerPage.getByLabel(/total cost|price/i).fill('50000')
    await buyerPage.getByLabel(/down payment/i).fill('4000')
    await buyerPage.getByLabel(/mortgage amount/i).fill('46000')
    await buyerPage.getByLabel(/monthly mortgage/i).fill('230')
    await buyerPage.getByLabel(/monthly rent|cashflow/i).fill('350')
    await buyerPage.getByRole('button', { name: /next/i }).click()
    await buyerPage.getByRole('button', { name: /submit for audit/i }).click()

    // ── Auditor approves ─────────────────────────────────────────────────
    await auditorPage.waitForURL(/\/game\/[A-Z0-9]+/)
    await auditorPage.getByRole('button', { name: /audits|pending/i }).click()
    await auditorPage.getByRole('button', { name: /review|details/i }).first().click()
    await auditorPage.getByRole('button', { name: /^approve$/i }).click()
    await auditorPage.getByRole('button', { name: /confirm/i }).click()

    // ── Verify totalExpenses reflects the new mortgage ──────────────────
    await buyerPage.waitForTimeout(1000) // socket update
    const expensesAfter = await readMetricValue(buyerPage, /total expenses/i)

    // Pre-fix bug (16.5.8): expensesAfter === expensesBefore (mortgage dropped).
    // Fixed: expensesAfter === expensesBefore + 230.
    expect(expensesAfter).toBe(expensesBefore + 230)

    // PAYDAY drops by the same amount (since totalIncome - totalExpenses)
    const paydayAfter = await readMetricValue(buyerPage, /payday/i)
    // Just assert it dropped — exact amount depends on profession defaults
    expect(paydayAfter).toBeLessThan(2710) // engineer default PAYDAY before mortgage

    await auditorPage.close()
  })
})

/**
 * Helper: read the numeric value out of a metric card by its label.
 * Strips $ and commas. Returns NaN if the card isn't found, which makes
 * the assertion fail fast.
 */
async function readMetricValue(page: import('@playwright/test').Page, label: RegExp): Promise<number> {
  const card = page.locator('[data-metric-card]', { hasText: label })
  const text = await card.locator('[data-metric-value]').innerText()
  return Number(text.replace(/[$,]/g, ''))
}
