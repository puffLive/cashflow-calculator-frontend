import { test, expect } from './helpers/fixtures'
import { readMetric } from './helpers/ui'

/**
 * Sell + Market Event flows through the UI.
 *
 * These flows used to be dead ends: the frontend posted sells, wizard
 * payoffs, and every Market-screen event to the buy-only /transactions
 * endpoint (each submission 400'd silently). transactionApi now routes each
 * category to its real endpoint, so the full flows are exercised here.
 */

async function giveHostAnApprovedStock(game: any, api: any) {
  const tx = await api.submitBuyStock(game.roomCode, game.host.playerId, {
    symbol: 'OK4U',
    pricePerShare: 10,
    shares: 10,
  })
  const txId = tx.transactionId ?? tx._id ?? tx.transaction?._id
  await api.audit(game.roomCode, String(txId), game.p2.playerId, 'approve')
  const player = await api.getPlayer(game.roomCode, game.host.playerId)
  expect(player.assets.length).toBe(1)
  return player
}

test.describe('Sell asset', () => {
  test('sell wizard opens and lists owned assets', async ({ game, api }) => {
    await giveHostAnApprovedStock(game, api)
    const { page } = game.host
    await page.reload() // pick up the new asset
    await page.getByRole('button', { name: /^sell asset$/i }).click()
    await expect(page).toHaveURL(/\/transaction\/sell$/)
    await expect(page.getByText(/OK4U/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('selling part of a stock position pays out on approval', async ({ game, api }) => {
    const before = await giveHostAnApprovedStock(game, api)
    const hostPage = game.host.page
    const p2Page = game.p2.page
    await hostPage.reload()

    await hostPage.getByRole('button', { name: /^sell asset$/i }).click()
    await hostPage.getByText(/OK4U/).first().click()
    await hostPage.getByRole('button', { name: /^next$/i }).click()

    // Sell 5 of the 10 shares at $12 apiece → $60 proceeds
    const numberInputs = hostPage.locator('input[type="number"]')
    await numberInputs.nth(0).fill('12')
    await numberInputs.nth(1).fill('5')
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
      .toBe(before.cashOnHand + 60)

    const after = await api.getPlayer(game.roomCode, game.host.playerId)
    expect(after.assets[0].quantity).toBe(5)
  })
})

test.describe('Market events', () => {
  test('doodad from the Market screen deducts cash after audit', async ({ game, api }) => {
    const hostPage = game.host.page
    const p2Page = game.p2.page
    const before = await api.getPlayer(game.roomCode, game.host.playerId)

    await hostPage.getByRole('button', { name: 'Market', exact: true }).click()
    await expect(hostPage).toHaveURL(/\/transaction\/market$/)

    // Event cards are clickable elements titled by event name (step 1),
    // then Next → amount + impact preview (step 2)
    await hostPage.getByText('Doodad', { exact: true }).first().click()
    await hostPage.getByRole('button', { name: /^next$/i }).click()
    await hostPage.locator('input[type="number"]').first().fill('75')
    await hostPage.getByRole('button', { name: /submit for audit/i }).click()
    await expect(hostPage).toHaveURL(/\/dashboard$/, { timeout: 15_000 })

    // Doodads require audit (they're spending) — approve as P2 if pending,
    // otherwise the backend applied it immediately.
    const pending = await api.getTransactions(game.roomCode, {
      auditorId: game.p2.playerId,
      auditStatus: 'pending',
    })
    if (pending.length > 0) {
      await api.audit(game.roomCode, String(pending[0]._id), game.p2.playerId, 'approve')
    }

    await expect
      .poll(async () => (await api.getPlayer(game.roomCode, game.host.playerId)).cashOnHand, {
        timeout: 10_000,
      })
      .toBe(before.cashOnHand - 75)
  })

  test.fixme('baby event preview shows the per-child expense', async ({ game }) => {
    // STILL BROKEN (frontend preview only — submission now works): the baby
    // preview looks up expenses.find(e => e.type === 'child'), which the
    // gameApi mapping never produces, so it always previews +$0/month. The
    // per-child cost lives in the profession data (perChildExpense).
  })

  test('collect money from another player requests their approval', async ({ game, api }) => {
    const hostPage = game.host.page

    // WORKAROUND for an app gap: CollectScreen reads the allPlayers Redux
    // slice but nothing on the direct Dashboard → Collect path ever fetches
    // it, so the player picker says "No other players are connected" unless
    // the Players screen was visited first (which populates the slice).
    await hostPage.getByRole('button', { name: 'Players', exact: true }).click()
    await expect(hostPage.getByText(game.p2.playerName).first()).toBeVisible({ timeout: 15_000 })
    await hostPage.getByRole('button', { name: 'Dashboard', exact: true }).click()

    // Host asks to collect $50 from P2 (lend/collect market event —
    // this flow goes through the correct market-event endpoint).
    await hostPage.getByRole('button', { name: 'Collect', exact: true }).click()
    await hostPage.getByText('Collect Money', { exact: true }).click()
    await hostPage.getByRole('button', { name: /^next$/i }).click()

    // Pick the other player, then enter the amount
    await hostPage.getByRole('button', { name: new RegExp(game.p2.playerName) }).click()
    await hostPage.getByRole('button', { name: /^next$/i }).click()
    await hostPage.locator('input[type="number"]').fill('50')

    await hostPage.getByRole('button', { name: /send request/i }).click()

    // The payer (P2) is notified for review/approval
    await expect(
      game.p2.page.getByText(/requesting \$50|is requesting/i).first(),
    ).toBeVisible({ timeout: 15_000 })
  })
})
