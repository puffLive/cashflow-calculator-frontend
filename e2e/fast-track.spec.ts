import { test, expect } from '@playwright/test'

/**
 * E2E spec for the Fast Track win condition (Feature 15.9.1).
 *
 * Buy enough income-producing assets that passive income > total expenses.
 * The next PAYDAY collection should flip `isOnFastTrack`, fire the
 * `fasttrack:achieved` socket event, and surface a celebration on the
 * collector's screen + a notification on every other player's screen.
 *
 * Skipped pending CI backend wiring.
 */

test.describe('Fast Track achievement (15.9)', () => {
  test.skip('15.9.1 — passive income exceeds expenses → Fast Track celebration on player + notification on others', async ({
    page,
    context,
  }) => {
    const winner = page
    const observer = await context.newPage()
    // ... setup both, start game; cross-link auditors ...

    // Engineer's total expenses is ~$2,710. We need passiveIncome > 2710.
    // Easiest: take a series of large dividend-bearing stock purchases and
    // approve each. (For a faster spec, set up a profession with lower
    // expenses, e.g. Janitor at ~$910 — see `@cashflow/shared` data.)

    // Loop: buy + approve until the dashboard's Passive Income > Total Expenses.
    // Implementation skipped — the core check is at the end.

    // Final round: collect PAYDAY, which is the moment the backend flips
    // isOnFastTrack and emits fasttrack:achieved.
    await winner.getByRole('button', { name: /collect payday/i }).click()

    // Celebration appears on the winner's screen
    await expect(winner.getByText(/escaped the rat race|fast track/i)).toBeVisible({
      timeout: 5000,
    })

    // Observer sees a notification toast referencing the winner's name
    await expect(observer.getByText(/escaped the rat race/i)).toBeVisible({
      timeout: 5000,
    })

    // Winner's dashboard switches to a Fast Track visual mode (banner / badge)
    await expect(winner.locator('[data-test=fast-track-banner]')).toBeVisible()

    await observer.close()
  })
})
