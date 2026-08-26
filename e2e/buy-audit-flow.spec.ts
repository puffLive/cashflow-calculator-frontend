import { test, expect } from './helpers/fixtures'
import { buyStockViaUI, readMetric } from './helpers/ui'

/**
 * The core transaction loop: buy an asset → auditor reviews → approve/reject.
 * Host (Secretary) buys; P2 (Teacher) is the host's auditor.
 */

test.describe('Buy → audit flow', () => {
  test('buy stock wizard previews the correct impact', async ({ game, api }) => {
    const { page } = game.host
    const before = await api.getPlayer(game.roomCode, game.host.playerId)

    await page.getByRole('button', { name: /^buy asset$/i }).click()
    await page.getByText('Stocks', { exact: true }).click()
    await page.getByRole('button', { name: /^next$/i }).click()

    const select = page.locator('select')
    await select.selectOption('OK4U')
    const numberInputs = page.locator('input[type="number"]')
    await numberInputs.nth(0).fill('10')
    await numberInputs.nth(1).fill('10')

    // Live math on the details step
    await expect(page.getByText(`$100`).first()).toBeVisible()

    await page.getByRole('button', { name: /preview impact/i }).click()
    await expect(page.getByRole('heading', { name: 'Financial Impact' })).toBeVisible()
    // Cash before and after
    await expect(page.getByText(`$${before.cashOnHand.toLocaleString()}`).first()).toBeVisible()
    await expect(
      page.getByText(`$${(before.cashOnHand - 100).toLocaleString()}`).first(),
    ).toBeVisible()
  })

  test('auditor receives, reviews, and approves; both sides update', async ({ game, api }) => {
    const hostPage = game.host.page
    const p2Page = game.p2.page
    const before = await api.getPlayer(game.roomCode, game.host.playerId)

    await buyStockViaUI(hostPage, { symbol: 'ON2U', price: 20, shares: 5 })

    // Transaction is pending on the backend, addressed to P2
    const pending = await api.getTransactions(game.roomCode, {
      auditorId: game.p2.playerId,
      auditStatus: 'pending',
    })
    expect(pending.length).toBe(1)

    // Auditor gets the socket notification and finds it in their queue
    await expect(p2Page.getByText(/submitted a .* for your review/i)).toBeVisible({
      timeout: 15_000,
    })
    await p2Page.getByRole('button', { name: /audits/i }).click()
    await expect(p2Page).toHaveURL(/\/audits$/)
    await expect(p2Page.getByText(game.host.playerName).first()).toBeVisible()

    await p2Page.getByRole('button', { name: /review transaction/i }).click()
    await p2Page.getByRole('button', { name: /approve transaction/i }).click()

    // Backend: transaction approved, money moved, asset added
    await expect
      .poll(async () => {
        const txs = await api.getTransactions(game.roomCode, { playerId: game.host.playerId })
        return txs[0]?.auditStatus
      }, { timeout: 10_000 })
      .toBe('approved')

    const after = await api.getPlayer(game.roomCode, game.host.playerId)
    expect(after.cashOnHand).toBe(before.cashOnHand - 100)
    expect(after.assets.length).toBe(1)
    expect(after.assets[0].name).toBe('ON2U')

    // Submitter's dashboard reflects the approved purchase
    await expect
      .poll(() => readMetric(hostPage, 'Cash on Hand'), { timeout: 15_000 })
      .toBe(before.cashOnHand - 100)
  })

  test('auditor rejects with a note; no money moves', async ({ game, api }) => {
    const hostPage = game.host.page
    const p2Page = game.p2.page
    const before = await api.getPlayer(game.roomCode, game.host.playerId)

    await buyStockViaUI(hostPage, { symbol: 'MYT4U', price: 30, shares: 2 })

    await p2Page.getByRole('button', { name: /audits/i }).click()
    await expect(p2Page.getByRole('button', { name: /review transaction/i })).toBeVisible({
      timeout: 15_000,
    })
    await p2Page.getByRole('button', { name: /review transaction/i }).click()

    await p2Page.getByRole('button', { name: /^reject transaction$/i }).click()
    await p2Page.locator('textarea').fill('Price looks wrong, resubmit please')
    await p2Page.getByRole('button', { name: /confirm reject/i }).click()

    // Backend: rejected with the note, and finances untouched
    await expect
      .poll(async () => {
        const txs = await api.getTransactions(game.roomCode, { playerId: game.host.playerId })
        return txs[0]?.auditStatus
      }, { timeout: 10_000 })
      .toBe('rejected')

    const txs = await api.getTransactions(game.roomCode, { playerId: game.host.playerId })
    expect(txs[0].auditorNote).toContain('Price looks wrong')

    const after = await api.getPlayer(game.roomCode, game.host.playerId)
    expect(after.cashOnHand).toBe(before.cashOnHand)
    expect(after.assets.length).toBe(0)

    // Submitter is told about the rejection
    await expect(
      hostPage.getByText(/rejected/i).first(),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('rejection modal shows the auditor note to the submitter only', async ({ game, api }) => {
    // Regression lock: the note used to be dropped (modal rendered with
    // rejectionNote='') and the room-wide broadcast opened the modal for
    // every player. The pending transaction is now recorded on submit and
    // the handler filters by playerId.
    const hostPage = game.host.page
    const p2Page = game.p2.page

    await buyStockViaUI(hostPage, { symbol: '2BIG', price: 5, shares: 4 })

    await p2Page.getByRole('button', { name: /audits/i }).click()
    await expect(p2Page.getByRole('button', { name: /review transaction/i })).toBeVisible({
      timeout: 15_000,
    })
    await p2Page.getByRole('button', { name: /review transaction/i }).click()
    await p2Page.getByRole('button', { name: /^reject transaction$/i }).click()
    await p2Page.locator('textarea').fill('Too pricey this month')
    await p2Page.getByRole('button', { name: /confirm reject/i }).click()

    // Submitter sees the modal WITH the auditor's note
    await expect(
      hostPage.getByRole('heading', { name: /transaction rejected/i }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(hostPage.getByText('Too pricey this month')).toBeVisible()

    // The auditor does NOT get the "your transaction was rejected" modal
    await expect(
      p2Page.getByRole('heading', { name: /transaction rejected/i }),
    ).toHaveCount(0)
  })

  test('queue shows multiple pending audits and counts down as they are handled', async ({
    game,
    api,
  }) => {
    const p2Page = game.p2.page

    // Two pending buys from the host, submitted via API for speed
    await api.submitBuyStock(game.roomCode, game.host.playerId, {
      symbol: 'OK4U',
      pricePerShare: 10,
      shares: 1,
    })
    await api.submitBuyStock(game.roomCode, game.host.playerId, {
      symbol: '2BIG',
      pricePerShare: 5,
      shares: 2,
    })

    await p2Page.getByRole('button', { name: /audits/i }).click()
    await expect(p2Page.getByRole('button', { name: /review transaction/i })).toHaveCount(2, {
      timeout: 15_000,
    })

    await p2Page.getByRole('button', { name: /review transaction/i }).first().click()
    await p2Page.getByRole('button', { name: /approve transaction/i }).click()

    await expect(p2Page.getByRole('button', { name: /review transaction/i })).toHaveCount(1, {
      timeout: 15_000,
    })
  })

  test.fixme(
    'auditor queue survives a page refresh',
    async ({ game }) => {
      // KNOWN GAP (frontend): the audit queue lives only in Redux, fed by live
      // audit:requested socket events. There is no rehydration fetch of
      // still-pending transactions, so refreshing the auditor's tab empties
      // their queue even though GET /transactions?auditorId=…&auditStatus=pending
      // still returns the items. Un-fixme when PendingAuditsScreen fetches
      // pending audits from the server on mount.
    },
  )
})
