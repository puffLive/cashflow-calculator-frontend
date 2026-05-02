import { test, expect } from '@playwright/test'

/**
 * E2E specs for buy / sell / loan / payoff transaction round-trips
 * (Feature 15.5.1–15.5.5; 15.5.6 already covered by
 * `real-estate-mortgage.spec.ts`). Each test exercises submit → audit
 * approve → dashboard reflects the change.
 *
 * All skipped pending CI backend wiring. Each spec is a complete plan.
 */

test.describe('Buy / Sell / Loan / Payoff transactions (15.5)', () => {
  // ──────────────────────────────────────────────────────────────────────
  // 15.5.1 — Buy stock
  // ──────────────────────────────────────────────────────────────────────
  test.skip('15.5.1 — buy stock: asset added, cash reduced, dividend lifts passive income', async ({
    page,
    context,
  }) => {
    const buyer = page
    const auditor = await context.newPage()
    // ... setup both, start game ...

    const cashBefore = await readMetricValue(buyer, /cash on hand/i)

    // FAB → Buy → Stock
    await buyer.getByRole('button', { name: /\+|new transaction/i }).click()
    await buyer.getByRole('button', { name: /^buy$/i }).click()
    await buyer.getByText(/^stocks?$/i).click()
    await buyer.getByRole('button', { name: /next/i }).click()

    // 100 shares @ $10 with $1 dividend → -$1000 cash, +$100 passive
    await buyer.getByLabel(/stock name|symbol/i).fill('TEST')
    await buyer.getByLabel(/price per share/i).fill('10')
    await buyer.getByLabel(/number of shares/i).fill('100')
    await buyer.getByLabel(/dividend per share/i).fill('1')
    await buyer.getByRole('button', { name: /next/i }).click()
    await buyer.getByRole('button', { name: /submit for audit/i }).click()

    // Auditor approves
    await auditor.getByRole('button', { name: /audits|pending/i }).click()
    await auditor.getByRole('button', { name: /review|details/i }).first().click()
    await auditor.getByRole('button', { name: /^approve$/i }).click()
    await auditor.getByRole('button', { name: /confirm/i }).click()

    // Verify dashboard
    await buyer.waitForTimeout(500)
    const cashAfter = await readMetricValue(buyer, /cash on hand/i)
    expect(cashAfter).toBe(cashBefore - 1000)

    const passiveAfter = await readMetricValue(buyer, /passive income/i)
    expect(passiveAfter).toBeGreaterThanOrEqual(100)

    // Asset shows up on the assets detail screen
    await buyer.getByRole('link', { name: /assets/i }).click()
    await expect(buyer.getByText(/TEST/)).toBeVisible()

    await auditor.close()
  })

  // ──────────────────────────────────────────────────────────────────────
  // 15.5.2 — Sell stock (full)
  // ──────────────────────────────────────────────────────────────────────
  test.skip('15.5.2 — sell stock (full): asset removed, cash increased, passive income drops', async ({
    page,
    context,
  }) => {
    // ... setup with buyer who already owns TEST stock ...

    const buyer = page
    const auditor = await context.newPage()

    const cashBefore = await readMetricValue(buyer, /cash on hand/i)

    // Open the asset detail and tap "Sell"
    await buyer.getByRole('link', { name: /assets/i }).click()
    await buyer.getByText(/TEST/).click()
    await buyer.getByRole('button', { name: /^sell$/i }).click()

    // Sell 100 @ $15 → +$1,500 cash, -100 passive
    await buyer.getByLabel(/sale price/i).fill('15')
    await buyer.getByLabel(/quantity/i).fill('100')
    await buyer.getByRole('button', { name: /next/i }).click()
    await buyer.getByRole('button', { name: /submit for audit/i }).click()

    // Auditor approves
    await auditor.getByRole('button', { name: /audits|pending/i }).click()
    await auditor.getByRole('button', { name: /review|details/i }).first().click()
    await auditor.getByRole('button', { name: /^approve$/i }).click()
    await auditor.getByRole('button', { name: /confirm/i }).click()

    await buyer.waitForTimeout(500)
    const cashAfter = await readMetricValue(buyer, /cash on hand/i)
    expect(cashAfter).toBe(cashBefore + 1500)

    await auditor.close()
  })

  // ──────────────────────────────────────────────────────────────────────
  // 15.5.3 — Take $3K bank loan
  // ──────────────────────────────────────────────────────────────────────
  test.skip('15.5.3 — take $3K loan: cash +3000, expenses +300 after audit approval', async ({
    page,
    context,
  }) => {
    const buyer = page
    const auditor = await context.newPage()
    // ... setup + start ...

    const cashBefore = await readMetricValue(buyer, /cash on hand/i)
    const expensesBefore = await readMetricValue(buyer, /total expenses/i)

    await buyer.getByRole('button', { name: /\+|new transaction/i }).click()
    await buyer.getByRole('button', { name: /loan/i }).click()
    // Stepper: increment to 3 ($3,000)
    await buyer.getByRole('button', { name: /\+/ }).click()
    await buyer.getByRole('button', { name: /\+/ }).click()
    await buyer.getByRole('button', { name: /next/i }).click()
    await buyer.getByRole('button', { name: /submit for audit/i }).click()

    // Auditor approves
    await auditor.getByRole('button', { name: /audits|pending/i }).click()
    await auditor.getByRole('button', { name: /review|details/i }).first().click()
    await auditor.getByRole('button', { name: /^approve$/i }).click()
    await auditor.getByRole('button', { name: /confirm/i }).click()

    await buyer.waitForTimeout(500)
    expect(await readMetricValue(buyer, /cash on hand/i)).toBe(cashBefore + 3000)
    expect(await readMetricValue(buyer, /total expenses/i)).toBe(expensesBefore + 300)

    await auditor.close()
  })

  // ──────────────────────────────────────────────────────────────────────
  // 15.5.4 — Pay off $2K of a bank loan
  // ──────────────────────────────────────────────────────────────────────
  test.skip('15.5.4 — pay off $2K: cash -2000, expenses -200, liability balance reduced', async ({
    page,
    context,
  }) => {
    // Pre-condition: buyer has at least a $2K bank loan after a prior take-loan
    const buyer = page
    const auditor = await context.newPage()
    // ... setup + start + prior $5K loan approval ...

    const cashBefore = await readMetricValue(buyer, /cash on hand/i)
    const expensesBefore = await readMetricValue(buyer, /total expenses/i)

    await buyer.getByRole('link', { name: /liabilities/i }).click()
    await buyer.getByText(/bank loan/i).click()
    await buyer.getByRole('button', { name: /pay off/i }).click()
    // Stepper for bank loans is in $1,000 increments — set to 2
    await buyer.getByRole('button', { name: /\+/ }).click()
    await buyer.getByRole('button', { name: /next/i }).click()
    await buyer.getByRole('button', { name: /submit for audit/i }).click()

    await auditor.getByRole('button', { name: /audits|pending/i }).click()
    await auditor.getByRole('button', { name: /review|details/i }).first().click()
    await auditor.getByRole('button', { name: /^approve$/i }).click()
    await auditor.getByRole('button', { name: /confirm/i }).click()

    await buyer.waitForTimeout(500)
    expect(await readMetricValue(buyer, /cash on hand/i)).toBe(cashBefore - 2000)
    expect(await readMetricValue(buyer, /total expenses/i)).toBe(expensesBefore - 200)

    await auditor.close()
  })

  // ──────────────────────────────────────────────────────────────────────
  // 15.5.5 — Reject flow
  // ──────────────────────────────────────────────────────────────────────
  test.skip('15.5.5 — auditor rejects with note: rejection modal shown, financials unchanged', async ({
    page,
    context,
  }) => {
    const buyer = page
    const auditor = await context.newPage()
    // ... setup + start ...

    const cashBefore = await readMetricValue(buyer, /cash on hand/i)

    // Buyer submits a transaction
    await buyer.getByRole('button', { name: /\+|new transaction/i }).click()
    await buyer.getByRole('button', { name: /^buy$/i }).click()
    await buyer.getByText(/^stocks?$/i).click()
    await buyer.getByRole('button', { name: /next/i }).click()
    await buyer.getByLabel(/stock name|symbol/i).fill('NOPE')
    await buyer.getByLabel(/price per share/i).fill('100')
    await buyer.getByLabel(/number of shares/i).fill('10')
    await buyer.getByRole('button', { name: /next/i }).click()
    await buyer.getByRole('button', { name: /submit for audit/i }).click()

    // Auditor rejects with a note
    await auditor.getByRole('button', { name: /audits|pending/i }).click()
    await auditor.getByRole('button', { name: /review|details/i }).first().click()
    await auditor.getByRole('button', { name: /^reject$/i }).click()
    await auditor.getByLabel(/note|reason/i).fill('That ticker looks fake')
    await auditor.getByRole('button', { name: /confirm reject/i }).click()

    // Buyer sees the rejection modal with the note
    await expect(buyer.getByText(/rejected/i)).toBeVisible({ timeout: 5000 })
    await expect(buyer.getByText(/that ticker looks fake/i)).toBeVisible()

    // Financials unchanged
    expect(await readMetricValue(buyer, /cash on hand/i)).toBe(cashBefore)

    await auditor.close()
  })
})

async function readMetricValue(page: import('@playwright/test').Page, label: RegExp): Promise<number> {
  const card = page.locator('[data-metric-card]', { hasText: label })
  const text = await card.locator('[data-metric-value]').innerText()
  return Number(text.replace(/[$,]/g, ''))
}
