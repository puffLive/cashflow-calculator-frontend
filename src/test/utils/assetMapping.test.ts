import { describe, expect, it } from 'vitest'
import {
  mapBackendAsset,
  mapBackendAssets,
  mapBackendLiability,
  mapBackendLiabilities,
} from '@/utils/assetMapping'

describe('mapBackendAsset', () => {
  it('renames the canonical IAsset fields onto the frontend Asset shape', () => {
    const result = mapBackendAsset({
      _id: '507f1f77bcf86cd799439011',
      type: 'stock',
      name: 'OK4U',
      costPerUnit: 50,
      quantity: 10,
      totalCost: 500,
      monthlyPassiveIncome: 5,
    })

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439011',
      type: 'stock',
      name: 'OK4U',
      quantity: 10,
      // costBasis is per-unit on the frontend (`totalValue = costBasis × quantity`)
      costBasis: 50,
      monthlyIncome: 5,
    })
  })

  it('falls back to legacy frontend field names when shared fields are missing', () => {
    // Profession seeds may already carry the frontend shape; map the
    // identity case without losing data.
    const result = mapBackendAsset({
      id: 'legacy-1',
      type: 'real_estate',
      name: '3/2 Rental',
      quantity: 1,
      costBasis: 50000,
      monthlyIncome: 120,
    })

    expect(result).toEqual({
      id: 'legacy-1',
      type: 'real_estate',
      name: '3/2 Rental',
      quantity: 1,
      costBasis: 50000,
      monthlyIncome: 120,
    })
  })

  it('derives per-unit costBasis from totalCost when costPerUnit is missing', () => {
    const result = mapBackendAsset({
      _id: 'a1',
      type: 'stock',
      name: 'GOOG',
      quantity: 5,
      totalCost: 1000,
      monthlyPassiveIncome: 0,
    })

    expect(result.costBasis).toBe(200) // 1000 / 5
  })

  it('defaults monthlyIncome to 0 when both fields are missing (e.g. gold)', () => {
    const result = mapBackendAsset({
      _id: 'g1',
      type: 'gold',
      name: 'Krugerrand',
      quantity: 3,
      costPerUnit: 1500,
      totalCost: 4500,
    })

    expect(result.monthlyIncome).toBe(0)
  })
})

describe('mapBackendAssets', () => {
  it('returns an empty array for non-array input', () => {
    expect(mapBackendAssets(undefined)).toEqual([])
    expect(mapBackendAssets(null)).toEqual([])
  })

  it('maps each asset', () => {
    const result = mapBackendAssets([
      { _id: 'a1', type: 'stock', name: 'A', quantity: 1, totalCost: 10 },
      { _id: 'a2', type: 'gold', name: 'B', quantity: 2, totalCost: 20 },
    ])
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('a1')
    expect(result[1].id).toBe('a2')
  })
})

describe('mapBackendLiability', () => {
  it('renames _id to id and preserves the rest', () => {
    const result = mapBackendLiability({
      _id: 'l1',
      type: 'real_estate_mortgage',
      name: 'Mortgage - Duplex',
      originalAmount: 46000,
      currentBalance: 46000,
      monthlyPayment: 230,
    })

    expect(result).toEqual({
      id: 'l1',
      type: 'real_estate_mortgage',
      name: 'Mortgage - Duplex',
      originalAmount: 46000,
      currentBalance: 46000,
      monthlyPayment: 230,
    })
  })
})

describe('mapBackendLiabilities', () => {
  it('returns an empty array for non-array input', () => {
    expect(mapBackendLiabilities(undefined)).toEqual([])
  })
})
