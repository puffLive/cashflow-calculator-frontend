import { describe, it, expect } from 'vitest'
import {
  calculateTakeLoanImpact,
  calculatePayOffLoanImpact,
  calculateBuyStockImpact,
  calculateBuyCDImpact,
  calculateBuyRealEstateImpact,
  calculateBuyGoldImpact,
  calculateSellAssetImpact,
  AssetType,
  LiabilityType,
} from '@cashflow/shared'
import { previewSnapshotFromImpact } from '@/utils/impactPreview'

/**
 * Parity tests for the frontend preview adapter. The shared calculation
 * engine is the source of truth — the frontend should never display a
 * preview that disagrees with what the backend will apply on audit
 * approval. These tests pin that contract.
 */
describe('previewSnapshotFromImpact', () => {
  // Minimal player snapshot with the fields the adapter reads. Numbers
  // chosen so income/expense diffs are easy to verify by inspection.
  const basePlayer = {
    cashOnHand: 5000,
    totalIncome: 4900,
    totalExpenses: 2710,
    passiveIncome: 0,
    paydayAmount: 2190,
    cashflow: -2710,
  }

  it('TAKE LOAN: cash up by amount, expenses up by 10%, payday + cashflow drop by monthly payment', () => {
    // $3,000 loan → +$3,000 cash, +$300 monthly payment
    const impact = calculateTakeLoanImpact({ liabilities: [] } as any, {
      amountIn1000s: 3,
    })
    expect(impact.cashDelta).toBe(3000)
    expect(impact.expenseDelta).toBe(300)

    const preview = previewSnapshotFromImpact(basePlayer, impact)

    expect(preview.cashOnHand).toEqual({ before: 5000, after: 8000 })
    expect(preview.totalExpenses).toEqual({ before: 2710, after: 3010 })
    expect(preview.paydayAmount).toEqual({ before: 2190, after: 1890 })
    expect(preview.cashflow).toEqual({ before: -2710, after: -3010 })
  })

  it('PAY OFF LOAN (full): cash down by payoff, expenses down by monthly payment', () => {
    const liability = {
      _id: 'loan-1',
      type: LiabilityType.BANK_LOAN,
      name: 'Bank Loan',
      originalAmount: 2000,
      currentBalance: 2000,
      monthlyPayment: 200,
    }
    const player = { ...basePlayer, cashOnHand: 5000, liabilities: [liability] }

    const impact = calculatePayOffLoanImpact(player as any, {
      liabilityId: 'loan-1',
      payoffAmount: 2000,
    })
    expect(impact.cashDelta).toBe(-2000)
    expect(impact.expenseDelta).toBe(-200)

    const preview = previewSnapshotFromImpact(basePlayer, impact)

    expect(preview.cashOnHand).toEqual({ before: 5000, after: 3000 })
    expect(preview.totalExpenses).toEqual({ before: 2710, after: 2510 })
    // PAYDAY rises 1:1 when expenses drop
    expect(preview.paydayAmount).toEqual({ before: 2190, after: 2390 })
    expect(preview.cashflow).toEqual({ before: -2710, after: -2510 })
  })

  it('passiveIncomeDelta lifts totalIncome, paydayAmount, and cashflow in lockstep', () => {
    // Hand-build an impact so the test isn't tied to the buy/sell path's
    // additional asset/liability writes.
    const impact = {
      cashDelta: -1000,
      passiveIncomeDelta: 100,
      description: 'fake',
    }

    const preview = previewSnapshotFromImpact(basePlayer, impact)

    expect(preview.cashOnHand).toEqual({ before: 5000, after: 4000 })
    expect(preview.passiveIncome).toEqual({ before: 0, after: 100 })
    expect(preview.totalIncome).toEqual({ before: 4900, after: 5000 })
    expect(preview.paydayAmount).toEqual({ before: 2190, after: 2290 })
    expect(preview.cashflow).toEqual({ before: -2710, after: -2610 })
  })

  it('returns only cashOnHand when no other deltas are set (idle preview)', () => {
    const preview = previewSnapshotFromImpact(basePlayer, { cashDelta: 0 })

    expect(preview.cashOnHand).toEqual({ before: 5000, after: 5000 })
    expect(preview.totalExpenses).toBeUndefined()
    expect(preview.paydayAmount).toBeUndefined()
    expect(preview.cashflow).toBeUndefined()
    expect(preview.passiveIncome).toBeUndefined()
    expect(preview.totalIncome).toBeUndefined()
  })

  // ────────────────────────────────────────────────────────────────────
  // Buy / sell parity — exercises every shape the wizards now produce.
  // ────────────────────────────────────────────────────────────────────

  it('BUY STOCK: 100 @ $10 with $1 dividend → cash −1000, passive +100', () => {
    const impact = calculateBuyStockImpact(basePlayer as any, {
      stockName: 'TEST',
      pricePerShare: 10,
      numShares: 100,
      dividendPerShare: 1,
    })
    const preview = previewSnapshotFromImpact(basePlayer, impact)

    expect(preview.cashOnHand).toEqual({ before: 5000, after: 4000 })
    expect(preview.passiveIncome).toEqual({ before: 0, after: 100 })
    // dividend lifts totalIncome / paydayAmount / cashflow 1:1
    expect(preview.totalIncome?.after).toBe(5000)
    expect(preview.paydayAmount?.after).toBe(2290)
    expect(preview.cashflow?.after).toBe(-2610)
  })

  it('BUY CD: $1,000 face value generates positive passive income', () => {
    const impact = calculateBuyCDImpact(basePlayer as any, {
      cdValue: 1000,
      interestRate: 50,
    })
    const preview = previewSnapshotFromImpact(basePlayer, impact)

    expect(preview.cashOnHand).toEqual({ before: 5000, after: 4000 })
    // The exact passive-income amount is the shared lib's responsibility;
    // the parity test just confirms the adapter surfaces whatever the
    // shared lib returns. (Backend tests already pin the formula.)
    expect(impact.passiveIncomeDelta).toBeGreaterThan(0)
    expect(preview.passiveIncome?.after).toBe((impact.passiveIncomeDelta ?? 0))
  })

  it('BUY REAL ESTATE: down payment + new mortgage expense', () => {
    const impact = calculateBuyRealEstateImpact(basePlayer as any, {
      name: '3/2 Rental',
      cost: 50000,
      downPayment: 4000,
      mortgageAmount: 46000,
      mortgagePayment: 230,
      monthlyCashflow: 350,
    })
    const preview = previewSnapshotFromImpact(basePlayer, impact)

    expect(preview.cashOnHand).toEqual({ before: 5000, after: 1000 })
    // Shared lib applies expenseDelta = mortgagePayment; preview reflects that
    expect(preview.totalExpenses?.after).toBe(2710 + 230)
    // Cashflow = monthlyCashflow → +350 passiveIncome, then -230 expenseDelta
    expect(preview.passiveIncome).toBeDefined()
  })

  it('BUY GOLD: 4 coins @ $250 → cash −1000, no passive income', () => {
    const impact = calculateBuyGoldImpact(basePlayer as any, {
      type: 'Krugerrand',
      costPerUnit: 250,
      quantity: 4,
    })
    const preview = previewSnapshotFromImpact(basePlayer, impact)

    expect(preview.cashOnHand).toEqual({ before: 5000, after: 4000 })
    expect(preview.passiveIncome).toBeUndefined()
  })

  it('SELL: full sell of an income-producing asset → cash up, passive down', () => {
    const asset = {
      _id: 'stock-1',
      type: AssetType.STOCK,
      name: 'TEST',
      costPerUnit: 10,
      quantity: 100,
      totalCost: 1000,
      monthlyPassiveIncome: 100,
      purchasedAt: new Date(),
    }
    const playerWithAsset = {
      ...basePlayer,
      passiveIncome: 100,
      totalIncome: 5000, // 4900 salary + 100 dividend
      assets: [asset],
    }

    const impact = calculateSellAssetImpact(playerWithAsset as any, {
      assetId: 'stock-1',
      salePrice: 1500,
      quantity: 100,
    })
    const preview = previewSnapshotFromImpact(playerWithAsset, impact)

    expect(preview.cashOnHand).toEqual({ before: 5000, after: 6500 })
    // Removing the asset removes its $100 monthly passive income
    expect(preview.passiveIncome).toEqual({ before: 100, after: 0 })
    // Shared also writes capitalGain = 500 but that's not a preview field
  })
})
