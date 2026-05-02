import { test, expect } from '@playwright/test'

/**
 * E2E specs for the two auditor modes (Feature 15.6.1–15.6.2):
 *   - Remote: each player on their own device; the auditor sees a
 *     pending-audit notification and approves from their own dashboard.
 *   - Handoff: same device — after the buyer submits, the wizard navigates
 *     to a "AUDITOR REVIEW" screen on the same browser; the auditor
 *     approves, then taps "Return to Player".
 *
 * Both skipped pending CI backend wiring.
 */

test.describe('Auditor modes (15.6)', () => {
  test.skip('15.6.1 — remote audit: notification badge appears, auditor approves, buyer dashboard updates', async ({
    page,
    context,
  }) => {
    const buyer = page
    const auditor = await context.newPage()
    // ... setup both, start game, cross-link auditors ...

    // Buyer submits a transaction (via the FAB → Buy → Stock flow)
    // ... full submit flow ...

    // Auditor sees the pending-audit badge on the Players nav tab
    await expect(auditor.locator('[data-test=pending-audit-badge]')).toBeVisible()

    // Auditor opens the pending-audits screen and approves
    await auditor.getByRole('button', { name: /audits|pending/i }).click()
    await expect(auditor.getByText(/pending review/i)).toBeVisible()

    await auditor.getByRole('button', { name: /review|details/i }).first().click()
    await auditor.getByRole('button', { name: /^approve$/i }).click()
    await auditor.getByRole('button', { name: /confirm/i }).click()

    // Buyer's dashboard reflects the approval — pending-tx banner disappears,
    // financials update via the `transaction:finalized` socket event.
    await expect(buyer.getByText(/pending audit/i)).not.toBeVisible({ timeout: 5000 })

    await auditor.close()
  })

  test.skip('15.6.2 — handoff audit: same device, auditor approves, "Return to Player" navigates back', async ({
    page,
  }) => {
    // Single-device flow — the wizard navigates to /handoff after the buyer
    // submits, then back to /dashboard after the auditor returns control.
    // ... full setup + start ...

    // Buyer submits a transaction with the "Handoff to Auditor" path
    // ... full submit flow ending in handoff button ...
    await page.getByRole('button', { name: /handoff to auditor/i }).click()

    // The handoff screen has a distinct "AUDITOR REVIEW" header
    await expect(page.getByText(/auditor review/i)).toBeVisible()

    // Auditor approves
    await page.getByRole('button', { name: /^approve$/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    // "Return to Player" navigates back to the player's dashboard
    await page.getByRole('button', { name: /return to player/i }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
