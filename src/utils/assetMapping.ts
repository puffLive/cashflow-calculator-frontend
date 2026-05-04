import type { Asset, Liability } from '@/types'

/**
 * The backend's shared `IAsset` shape uses `_id` / `totalCost` /
 * `costPerUnit` / `monthlyPassiveIncome`; the frontend's `Asset` type
 * (used by AssetDetailScreen, SellTransactionScreen, MarketEventScreen,
 * and impact-preview math) uses `id` / `costBasis` / `monthlyIncome`.
 * Without this mapper, raw backend assets land in `playerSlice.assets`
 * with the wrong field names and every read site shows `undefined` (and
 * `costBasis * quantity` becomes `NaN`).
 *
 * Apply at every boundary that writes to `playerSlice.assets` /
 * `playerSlice.liabilities`: the `getPlayer` RTK Query and the
 * audit-approval `player:updated` socket handler.
 */
export function mapBackendAsset(raw: any): Asset {
  // The frontend's `costBasis` is per-unit (AssetDetailScreen renders it as
  // "Cost Basis" on the unit card and computes `totalValue = costBasis ×
  // quantity`). The backend's IAsset stores both `costPerUnit` AND
  // `totalCost` — the per-unit one is what we want here.
  const quantity = raw.quantity ?? 1
  const perUnit =
    raw.costPerUnit ??
    raw.costBasis ??
    (raw.totalCost !== undefined ? raw.totalCost / (quantity || 1) : 0)
  return {
    id: raw.id ?? raw._id?.toString?.() ?? raw._id ?? '',
    name: raw.name,
    type: raw.type,
    quantity,
    costBasis: perUnit,
    monthlyIncome: raw.monthlyIncome ?? raw.monthlyPassiveIncome ?? 0,
  }
}

export function mapBackendAssets(raw: any): Asset[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapBackendAsset)
}

export function mapBackendLiability(raw: any): Liability {
  return {
    id: raw.id ?? raw._id?.toString?.() ?? raw._id ?? '',
    name: raw.name,
    type: raw.type,
    originalAmount: raw.originalAmount ?? 0,
    currentBalance: raw.currentBalance ?? raw.originalAmount ?? 0,
    monthlyPayment: raw.monthlyPayment ?? 0,
  }
}

export function mapBackendLiabilities(raw: any): Liability[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapBackendLiability)
}
