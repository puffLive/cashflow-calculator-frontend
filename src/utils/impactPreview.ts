import type { TransactionImpact } from '@cashflow/shared'

/**
 * Frontend-shaped preview snapshot consumed by `<TransactionImpactPreview>`.
 * Each field is `{ before, after }` so the component can render the diff.
 * Optional fields are only populated when the impact actually moved them —
 * matching what the existing wizards already produced by hand.
 */
export interface PreviewSnapshot {
  cashOnHand: { before: number; after: number }
  totalExpenses?: { before: number; after: number }
  totalIncome?: { before: number; after: number }
  passiveIncome?: { before: number; after: number }
  paydayAmount?: { before: number; after: number }
  cashflow?: { before: number; after: number }
}

/**
 * Just the fields of the current player state we need to compute a preview
 * snapshot. Defining a structural interface (rather than importing the
 * frontend's full `Player` type) keeps this helper consumable from both the
 * Redux state shape and any direct-pass callers.
 */
export interface PreviewablePlayer {
  cashOnHand: number
  totalIncome: number
  totalExpenses: number
  passiveIncome: number
  paydayAmount: number
  cashflow: number
}

/**
 * Translate a shared `TransactionImpact` into the `{ before, after }`
 * preview shape the existing UI components expect. The shared engine is
 * the source of truth for what a transaction *will* do; this helper just
 * stages those deltas against the player's current totals.
 *
 * Only fields the impact touches are emitted, mirroring the previous
 * hand-rolled `calculateImpact()` implementations.
 */
export function previewSnapshotFromImpact(
  player: PreviewablePlayer,
  impact: TransactionImpact,
): PreviewSnapshot {
  const out: PreviewSnapshot = {
    cashOnHand: {
      before: player.cashOnHand,
      after: player.cashOnHand + (impact.cashDelta ?? 0),
    },
  }

  if (impact.expenseDelta !== undefined && impact.expenseDelta !== 0) {
    const beforeExpenses = player.totalExpenses
    const afterExpenses = beforeExpenses + impact.expenseDelta
    out.totalExpenses = { before: beforeExpenses, after: afterExpenses }
    // PAYDAY = totalIncome − totalExpenses ; cashflow = passiveIncome − totalExpenses.
    // An expense increase reduces both 1:1.
    out.paydayAmount = {
      before: player.paydayAmount,
      after: player.paydayAmount - impact.expenseDelta,
    }
    out.cashflow = {
      before: player.cashflow,
      after: player.cashflow - impact.expenseDelta,
    }
  }

  if (impact.passiveIncomeDelta !== undefined && impact.passiveIncomeDelta !== 0) {
    out.passiveIncome = {
      before: player.passiveIncome,
      after: player.passiveIncome + impact.passiveIncomeDelta,
    }
    // Income up → totalIncome up, paydayAmount up, cashflow up (1:1).
    out.totalIncome = {
      before: player.totalIncome,
      after: player.totalIncome + impact.passiveIncomeDelta,
    }
    out.paydayAmount = {
      before: out.paydayAmount?.before ?? player.paydayAmount,
      after: (out.paydayAmount?.after ?? player.paydayAmount) + impact.passiveIncomeDelta,
    }
    out.cashflow = {
      before: out.cashflow?.before ?? player.cashflow,
      after: (out.cashflow?.after ?? player.cashflow) + impact.passiveIncomeDelta,
    }
  }

  return out
}
