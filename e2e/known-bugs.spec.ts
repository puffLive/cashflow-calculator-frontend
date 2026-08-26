import { test, expect } from './helpers/fixtures'

/**
 * Regression locks for bugs found in the 2026-08 code review, now FIXED.
 * These tests assert the corrected behavior and must stay green:
 *  - bank-loan expense double-count (shared engine)
 *  - orphaned no-auditor pending transactions (backend auto-assigns)
 *  - players-overview "cashflow" mislabel (was the PAYDAY figure)
 *  - stale vendored @cashflow/shared build (copy:shared now replaces)
 */

test.describe('Regression locks (2026-08 review)', () => {
  test('taking a $2,000 loan raises expenses by exactly $200', async ({ game, api }) => {
    const before = await api.getPlayer(game.roomCode, game.host.playerId)
    await api.takeLoan(game.roomCode, game.host.playerId, 2)

    const pending = await api.getTransactions(game.roomCode, {
      auditorId: game.p2.playerId,
      auditStatus: 'pending',
    })
    await api.audit(game.roomCode, String(pending[0]._id), game.p2.playerId, 'approve')

    await expect
      .poll(async () => (await api.getPlayer(game.roomCode, game.host.playerId)).totalExpenses, {
        timeout: 10_000,
      })
      .toBe(before.totalExpenses + 200)

    // And the payment sits on the bankLoanPayment line, not otherExpenses
    const after = await api.getPlayer(game.roomCode, game.host.playerId)
    expect(after.expenses.bankLoanPayment).toBe(200)
    expect(after.expenses.otherExpenses).toBe(before.expenses.otherExpenses)
  })

  test('a submission from a player with no auditor gets one auto-assigned', async ({
    api,
    request,
  }) => {
    // Arrange a started game where the host never picked an auditor
    const created = await api.createGame('No Auditor Host')
    const joined = await api.joinGame(created.roomCode, 'Bystander')
    await api.setupPlayer(created.roomCode, created.hostPlayerId, { profession: 'secretary' })
    await api.setupPlayer(created.roomCode, joined.playerId, { profession: 'teacher' })
    await api.startGame(created.roomCode, created.hostPlayerId)

    const res = await request.post(
      `http://localhost:3100/api/games/${created.roomCode}/players/${created.hostPlayerId}/transactions`,
      {
        data: {
          type: 'buy',
          subType: 'stock',
          stockName: 'OK4U',
          pricePerShare: 10,
          numShares: 1,
        },
      },
    )
    expect(res.ok()).toBeTruthy()

    // The other player was auto-assigned as auditor, so the transaction is
    // pending but APPROVABLE (previously it was frozen forever).
    const host = await api.getPlayer(created.roomCode, created.hostPlayerId)
    expect(String(host.auditorPlayerId?._id ?? host.auditorPlayerId)).toBe(joined.playerId)

    const pending = await api.getTransactions(created.roomCode, {
      auditorId: joined.playerId,
      auditStatus: 'pending',
    })
    expect(pending.length).toBe(1)

    await api.audit(created.roomCode, String(pending[0]._id), joined.playerId, 'approve')
    const after = await api.getPlayer(created.roomCode, created.hostPlayerId)
    expect(after.assets.length).toBe(1)
  })

  test('auditor reassignment adopts still-pending transactions', async ({ api }) => {
    const created = await api.createGame('Adoption Host')
    const joined = await api.joinGame(created.roomCode, 'First Auditor')
    const third = await api.joinGame(created.roomCode, 'Second Auditor')
    await api.setupPlayer(created.roomCode, created.hostPlayerId, {
      profession: 'secretary',
      auditorPlayerId: joined.playerId,
    })
    await api.setupPlayer(created.roomCode, joined.playerId, { profession: 'teacher' })
    await api.setupPlayer(created.roomCode, third.playerId, { profession: 'nurse' })
    await api.startGame(created.roomCode, created.hostPlayerId)

    await api.submitBuyStock(created.roomCode, created.hostPlayerId, {
      symbol: 'OK4U',
      pricePerShare: 10,
      shares: 2,
    })

    // Reassign the host's auditor from First → Second
    await api.reassignAuditor(created.roomCode, created.hostPlayerId, third.playerId)

    // The pending transaction moved with the reassignment
    const adopted = await api.getTransactions(created.roomCode, {
      auditorId: third.playerId,
      auditStatus: 'pending',
    })
    expect(adopted.length).toBe(1)

    const stale = await api.getTransactions(created.roomCode, {
      auditorId: joined.playerId,
      auditStatus: 'pending',
    })
    expect(stale.length).toBe(0)

    // And the new auditor can actually approve it
    await api.audit(created.roomCode, String(adopted[0]._id), third.playerId, 'approve')
    const after = await api.getPlayer(created.roomCode, created.hostPlayerId)
    expect(after.assets.length).toBe(1)
  })

  test('players overview reports cashflow as passive income minus expenses', async ({
    game,
    api,
  }) => {
    const overview = await api.getPlayers(game.roomCode)
    const host = overview.find((p: any) => p.playerName === game.host.playerName)
    const detail = await api.getPlayer(game.roomCode, game.host.playerId)

    expect(host.cashflow).toBe(detail.passiveIncome - detail.totalExpenses)
    expect(host.paydayAmount).toBe(detail.totalIncome - detail.totalExpenses)
  })

  test('backend starting financials match the shared-package source of truth', async ({ api }) => {
    const created = await api.createGame('Drift Detector')
    await api.setupPlayer(created.roomCode, created.hostPlayerId, { profession: 'secretary' })
    const player = await api.getPlayer(created.roomCode, created.hostPlayerId)

    // Values from shared/src/data/professions.ts (which matches Professions.csv)
    expect(player.cashOnHand).toBe(710)
    expect(player.expenses.otherExpenses).toBe(570)
    expect(player.expenses.retailPayment).toBe(50)
  })

  test('selling a mortgaged property nets out the mortgage balance', async ({ game, api, request }) => {
    // Buy real estate: $50,000 property, $500 down, $49,500 mortgage
    const res = await request.post(
      `http://localhost:3100/api/games/${game.roomCode}/players/${game.host.playerId}/transactions`,
      {
        data: {
          type: 'buy',
          subType: 'real_estate',
          propertyName: 'Test Duplex',
          price: 50000,
          downPayment: 500, // affordable for a Secretary's starting cash
          mortgageAmount: 49500,
          monthlyMortgage: 400,
          monthlyRent: 560,
        },
      },
    )
    expect(res.ok(), await res.text()).toBeTruthy()

    let pending = await api.getTransactions(game.roomCode, {
      auditorId: game.p2.playerId,
      auditStatus: 'pending',
    })
    await api.audit(game.roomCode, String(pending[0]._id), game.p2.playerId, 'approve')

    const afterBuy = await api.getPlayer(game.roomCode, game.host.playerId)
    expect(afterBuy.assets.length).toBe(1)
    const cashAfterBuy = afterBuy.cashOnHand
    const expensesAfterBuy = afterBuy.totalExpenses

    // Sell it for $52,000: proceeds must be 52,000 − 49,500 mortgage balance
    const assetId = String(afterBuy.assets[0]._id)
    const sellRes = await request.post(
      `http://localhost:3100/api/games/${game.roomCode}/players/${game.host.playerId}/transactions/sell`,
      { data: { type: 'sell', assetId, salePrice: 52000 } },
    )
    expect(sellRes.ok(), await sellRes.text()).toBeTruthy()

    pending = await api.getTransactions(game.roomCode, {
      auditorId: game.p2.playerId,
      auditStatus: 'pending',
    })
    await api.audit(game.roomCode, String(pending[0]._id), game.p2.playerId, 'approve')

    const afterSell = await api.getPlayer(game.roomCode, game.host.playerId)
    expect(afterSell.cashOnHand).toBe(cashAfterBuy + (52000 - 49500))
    expect(afterSell.assets.length).toBe(0)
    expect(afterSell.liabilities.some((l: any) => l.type === 'real_estate_mortgage')).toBe(false)
    // No phantom expense credit: expenses unchanged by the sale
    expect(afterSell.totalExpenses).toBe(expensesAfterBuy)
  })
})
