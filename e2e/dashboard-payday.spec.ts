import { test, expect } from '@playwright/test'

/**
 * E2E specs for the dashboard + PAYDAY collection (Feature 15.4.1–15.4.3).
 * Skipped pending CI backend wiring.
 */

test.describe('Dashboard + PAYDAY (15.4)', () => {
  test.skip('15.4.1 — dashboard renders all 6 metric cards with correct values after setup', async ({
    page,
  }) => {
    // ... full create + setup + start flow ...

    await expect(page).toHaveURL(/\/dashboard$/)

    // The six metric cards: Cash on Hand, Cashflow, Total Income, Total
    // Expenses, PAYDAY Amount, Passive Income.
    await expect(page.getByText(/cash on hand/i)).toBeVisible()
    await expect(page.getByText(/cashflow/i)).toBeVisible()
    await expect(page.getByText(/total income/i)).toBeVisible()
    await expect(page.getByText(/total expenses/i)).toBeVisible()
    await expect(page.getByText(/payday/i)).toBeVisible()
    await expect(page.getByText(/passive income/i)).toBeVisible()

    // For Engineer profession, totalExpenses should be $2,710
    await expect(page.getByText(/\$2,710/)).toBeVisible()
  })

  test.skip('15.4.2 — Collect PAYDAY adds the amount to cash; success toast shown', async ({
    page,
  }) => {
    // ... setup + start flow ...
    await page.waitForURL(/\/dashboard$/)

    // Capture the cash before
    const cashBefore = await readMetricValue(page, /cash on hand/i)

    // Click PAYDAY (button label includes the amount, e.g. "Collect PAYDAY: $2,190")
    await page.getByRole('button', { name: /collect payday/i }).click()

    // Toast appears
    await expect(page.getByText(/payday collected/i)).toBeVisible({ timeout: 5000 })

    // Cash should have increased by the PAYDAY amount (Engineer: $2,190)
    const cashAfter = await readMetricValue(page, /cash on hand/i)
    expect(cashAfter).toBe(cashBefore + 2190)
  })

  test.skip('15.4.3 — PAYDAY does NOT trigger an auditor notification', async ({
    page,
    context,
  }) => {
    // Two players. Player1 collects PAYDAY. Player2 (their auditor) should
    // see the activity-feed entry but NO pending audit notification — PAYDAY
    // is auditStatus=NOT_REQUIRED on the backend.
    const player1 = page
    const player2 = await context.newPage()
    // ... setup + start ...

    await player1.getByRole('button', { name: /collect payday/i }).click()
    await player1.waitForTimeout(500) // settle the socket event

    // Player 2 should not have a pending-audit badge
    const badge = player2.locator('[data-test=pending-audit-badge]')
    await expect(badge).not.toBeVisible()

    await player2.close()
  })
})

async function readMetricValue(page: import('@playwright/test').Page, label: RegExp): Promise<number> {
  const card = page.locator('[data-metric-card]', { hasText: label })
  const text = await card.locator('[data-metric-value]').innerText()
  return Number(text.replace(/[$,]/g, ''))
}
