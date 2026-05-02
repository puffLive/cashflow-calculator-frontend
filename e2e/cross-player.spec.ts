import { test, expect } from '@playwright/test'

/**
 * E2E specs for cross-player real-time sync (Feature 15.7.1–15.7.2).
 *
 * These specs run two browser contexts in parallel — one for Player A
 * (acting), one for Player B (observing) — and assert that socket-driven
 * updates land on the observer's screen via the existing Redux ↔ Socket.io
 * bridge in `useSocketEvents`.
 *
 * Skipped pending CI backend wiring.
 */

test.describe('Cross-player real-time sync (15.7)', () => {
  test.skip('15.7.1 — Player A buys + audit-approves; Player B\'s overview reflects new cash + asset count', async ({
    page,
    context,
  }) => {
    const playerA = page
    const playerB = await context.newPage()
    // ... setup both, start game, cross-link auditors ...

    // Player B opens the Players Overview tab
    await playerB.getByRole('link', { name: /players/i }).click()

    // Capture A's cash + assetCount on B's overview
    const cardA = playerB.locator('[data-test=player-card]', { hasText: /Alice/i })
    const cashBefore = Number(
      (await cardA.locator('[data-test=cash-on-hand]').innerText()).replace(/[$,]/g, ''),
    )
    const assetCountBefore = Number(
      await cardA.locator('[data-test=asset-count]').innerText(),
    )

    // Player A submits a $1,000 stock purchase, B (the auditor) approves it
    await playerA.getByRole('button', { name: /\+|new transaction/i }).click()
    await playerA.getByRole('button', { name: /^buy$/i }).click()
    await playerA.getByText(/^stocks?$/i).click()
    await playerA.getByRole('button', { name: /next/i }).click()
    await playerA.getByLabel(/stock name|symbol/i).fill('TEST')
    await playerA.getByLabel(/price per share/i).fill('10')
    await playerA.getByLabel(/number of shares/i).fill('100')
    await playerA.getByRole('button', { name: /next/i }).click()
    await playerA.getByRole('button', { name: /submit for audit/i }).click()

    await playerB.getByRole('button', { name: /audits|pending/i }).click()
    await playerB.getByRole('button', { name: /review|details/i }).first().click()
    await playerB.getByRole('button', { name: /^approve$/i }).click()
    await playerB.getByRole('button', { name: /confirm/i }).click()

    // Back to overview on B's screen — assertion is via the player:updated
    // socket event mapping in useSocketEvents.
    await playerB.getByRole('link', { name: /players/i }).click()
    await playerB.waitForTimeout(500)

    const cashAfter = Number(
      (await cardA.locator('[data-test=cash-on-hand]').innerText()).replace(/[$,]/g, ''),
    )
    const assetCountAfter = Number(
      await cardA.locator('[data-test=asset-count]').innerText(),
    )

    expect(cashAfter).toBe(cashBefore - 1000)
    expect(assetCountAfter).toBe(assetCountBefore + 1)

    await playerB.close()
  })

  test.skip('15.7.2 — Player A collects PAYDAY; activity feed on B prepends the entry in real time', async ({
    page,
    context,
  }) => {
    const playerA = page
    const playerB = await context.newPage()
    // ... setup + start ...

    // Player B opens the activity feed
    await playerB.getByRole('link', { name: /activity|feed/i }).click()
    const feedCountBefore = await playerB.locator('[data-test=feed-entry]').count()

    // Player A collects PAYDAY
    await playerA.getByRole('button', { name: /collect payday/i }).click()

    // B's feed gets a new entry within a couple seconds (via payday:collected event)
    await expect
      .poll(async () => playerB.locator('[data-test=feed-entry]').count(), {
        timeout: 5000,
      })
      .toBe(feedCountBefore + 1)

    // The newest entry mentions Alice and her PAYDAY amount
    const newest = playerB.locator('[data-test=feed-entry]').first()
    await expect(newest).toContainText(/Alice/i)
    await expect(newest).toContainText(/payday/i)

    await playerB.close()
  })
})
