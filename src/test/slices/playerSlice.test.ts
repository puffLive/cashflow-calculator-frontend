import { describe, it, expect } from 'vitest'
import reducer, {
  setPlayerData,
  updateFinancials,
  addIncome,
  removeIncome,
  addExpense,
  removeExpense,
  addAsset,
  removeAsset,
  addLiability,
  removeLiability,
  updateCashOnHand,
  collectPayday,
  setFastTrack,
  resetPlayer,
  selectCurrentPlayer,
  selectPaydayAmount,
  selectIsOnFastTrack,
} from '@/store/slices/playerSlice'

describe('playerSlice', () => {
  it('initial state has all financial fields zeroed', () => {
    const s = reducer(undefined, { type: '@@INIT' })
    expect(s.cashOnHand).toBe(0)
    expect(s.salary).toBe(0)
    expect(s.totalIncome).toBe(0)
    expect(s.assets).toEqual([])
    expect(s.liabilities).toEqual([])
  })

  it('setPlayerData merges arbitrary fields', () => {
    const s = reducer(
      undefined,
      setPlayerData({ id: 'p1', name: 'Alice', profession: 'engineer', cashOnHand: 5000 }),
    )
    expect(s.id).toBe('p1')
    expect(s.profession).toBe('engineer')
    expect(s.cashOnHand).toBe(5000)
  })

  describe('updateFinancials', () => {
    it('recomputes totalIncome / cashflow / paydayAmount from salary + passive + expenses', () => {
      const s = reducer(
        undefined,
        updateFinancials({ salary: 4900, passiveIncome: 100, totalExpenses: 2710 }),
      )
      expect(s.totalIncome).toBe(5000) // salary + passive
      expect(s.cashflow).toBe(-2610) // passive - expenses
      expect(s.paydayAmount).toBe(2290) // totalIncome - expenses
    })

    it('flips isOnFastTrack when passive income reaches expenses', () => {
      const s = reducer(
        undefined,
        updateFinancials({ salary: 0, passiveIncome: 3000, totalExpenses: 3000 }),
      )
      expect(s.isOnFastTrack).toBe(true)
    })

    it('keeps isOnFastTrack false when passive < expenses', () => {
      const s = reducer(
        undefined,
        updateFinancials({ salary: 4900, passiveIncome: 100, totalExpenses: 200 }),
      )
      expect(s.isOnFastTrack).toBe(false)
    })
  })

  describe('income / expense / asset / liability arrays', () => {
    it('addIncome recomputes passiveIncome from non-salary entries', () => {
      let s = reducer(
        undefined,
        addIncome({ id: 'i1', name: 'Salary', amount: 4900, type: 'salary' }),
      )
      // Salary entries are excluded from passive income
      expect(s.passiveIncome).toBe(0)

      s = reducer(s, addIncome({ id: 'i2', name: 'Dividend', amount: 100, type: 'dividend' }))
      expect(s.passiveIncome).toBe(100)
    })

    it('removeIncome recomputes passiveIncome', () => {
      let s = reducer(
        undefined,
        addIncome({ id: 'i1', name: 'Dividend', amount: 100, type: 'dividend' }),
      )
      s = reducer(s, addIncome({ id: 'i2', name: 'Rental', amount: 350, type: 'rental' }))
      expect(s.passiveIncome).toBe(450)

      s = reducer(s, removeIncome('i1'))
      expect(s.passiveIncome).toBe(350)
    })

    it('addExpense / removeExpense mutate the array (totalExpenses managed externally)', () => {
      let s = reducer(undefined, addExpense({ id: 'e1', name: 'Taxes', amount: 1050, type: 'fixed' }))
      expect(s.expenses).toHaveLength(1)
      s = reducer(s, removeExpense('e1'))
      expect(s.expenses).toEqual([])
    })

    it('addAsset / removeAsset mutate the assets array', () => {
      const asset = {
        id: 'a1',
        name: 'TEST',
        type: 'stock' as const,
        quantity: 100,
        costBasis: 1000,
        monthlyIncome: 0,
      }
      let s = reducer(undefined, addAsset(asset))
      expect(s.assets).toHaveLength(1)
      s = reducer(s, removeAsset('a1'))
      expect(s.assets).toEqual([])
    })

    it('addLiability / removeLiability mutate the liabilities array', () => {
      const liability = {
        id: 'l1',
        name: 'Bank Loan',
        type: 'bank_loan',
        originalAmount: 1000,
        currentBalance: 1000,
        monthlyPayment: 100,
      }
      let s = reducer(undefined, addLiability(liability))
      expect(s.liabilities).toHaveLength(1)
      s = reducer(s, removeLiability('l1'))
      expect(s.liabilities).toEqual([])
    })
  })

  it('updateCashOnHand sets the field directly', () => {
    const s = reducer(undefined, updateCashOnHand(7400))
    expect(s.cashOnHand).toBe(7400)
  })

  it('collectPayday adds paydayAmount to cashOnHand (incrementer, not setter)', () => {
    let s = reducer(
      undefined,
      setPlayerData({ cashOnHand: 5000, paydayAmount: 2400 }),
    )
    s = reducer(s, collectPayday())
    expect(s.cashOnHand).toBe(7400)
  })

  it('setFastTrack toggles the flag', () => {
    let s = reducer(undefined, setFastTrack(true))
    expect(s.isOnFastTrack).toBe(true)
    s = reducer(s, setFastTrack(false))
    expect(s.isOnFastTrack).toBe(false)
  })

  it('resetPlayer returns to initial state', () => {
    let s = reducer(undefined, setPlayerData({ id: 'p1', cashOnHand: 9999 }))
    s = reducer(s, resetPlayer())
    expect(s.id).toBeNull()
    expect(s.cashOnHand).toBe(0)
  })

  describe('selectors', () => {
    const buildState = (over: Partial<any> = {}) => ({
      player: {
        id: 'p1',
        name: 'Alice',
        cashOnHand: 5000,
        paydayAmount: 2190,
        isOnFastTrack: false,
        ...over,
      },
    })

    it('selectCurrentPlayer returns the slice state', () => {
      expect(selectCurrentPlayer(buildState() as any).id).toBe('p1')
    })

    it('selectPaydayAmount + selectIsOnFastTrack read individual fields', () => {
      expect(selectPaydayAmount(buildState({ paydayAmount: 2400 }) as any)).toBe(2400)
      expect(selectIsOnFastTrack(buildState({ isOnFastTrack: true }) as any)).toBe(true)
    })
  })
})
