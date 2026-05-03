import { describe, expect, it } from 'vitest'
import { AVAILABLE_REAL_ESTATE } from '@/constants/realEstate'

describe('AVAILABLE_REAL_ESTATE', () => {
  it('lists all 8 canonical Cashflow 101 properties', () => {
    expect(AVAILABLE_REAL_ESTATE).toHaveLength(8)
  })

  it('exposes uniquely-labeled options (so two Apartment rows cannot collide)', () => {
    const labels = AVAILABLE_REAL_ESTATE.map((p) => p.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('matches the unit counts from the canonical Assets sheet', () => {
    const expected: Record<string, number> = {
      'Condo - 2Br/1Ba': 1,
      'House - 3Br/2Ba': 1,
      Duplex: 2,
      '4-Plex': 4,
      '8-Plex': 8,
      'Apartment - 12 units': 12,
      'Apartment - 24 units': 24,
      'Apartment - 60 units': 60,
    }
    for (const property of AVAILABLE_REAL_ESTATE) {
      expect(expected[property.label]).toBe(property.units)
    }
  })
})
