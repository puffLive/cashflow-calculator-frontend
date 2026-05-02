import { describe, expect, it } from 'vitest'
import {
  buildBuySubmitDetails,
  type BuyFormDetails,
} from '@/utils/buyTransactionPayload'

describe('buildBuySubmitDetails', () => {
  describe('stock', () => {
    it('renames name→stockName and numberOfShares→numShares', () => {
      const result = buildBuySubmitDetails('stock', {
        name: 'AAPL',
        pricePerShare: 150,
        numberOfShares: 10,
      })

      expect(result).toEqual({
        stockName: 'AAPL',
        pricePerShare: 150,
        numShares: 10,
      })
    })

    it('passes dividendPerShare through when provided', () => {
      const result = buildBuySubmitDetails('stock', {
        name: 'MSFT',
        pricePerShare: 300,
        numberOfShares: 5,
        dividendPerShare: 2,
      })

      expect(result).toEqual({
        stockName: 'MSFT',
        pricePerShare: 300,
        numShares: 5,
        dividendPerShare: 2,
      })
    })

    it('omits dividendPerShare when undefined (does not send 0)', () => {
      const result = buildBuySubmitDetails('stock', {
        name: 'GOOG',
        pricePerShare: 100,
        numberOfShares: 1,
      })

      expect(result).not.toHaveProperty('dividendPerShare')
    })

    it('defaults missing numeric fields to 0', () => {
      const result = buildBuySubmitDetails('stock', { name: 'TSLA' })

      expect(result).toEqual({
        stockName: 'TSLA',
        pricePerShare: 0,
        numShares: 0,
      })
    })
  })

  describe('mutual_fund', () => {
    it('renames name→fundName and numberOfShares→numShares', () => {
      const result = buildBuySubmitDetails('mutual_fund', {
        name: 'VTSAX',
        pricePerShare: 50,
        numberOfShares: 100,
        dividendPerShare: 1,
      })

      expect(result).toEqual({
        fundName: 'VTSAX',
        pricePerShare: 50,
        numShares: 100,
        dividendPerShare: 1,
      })
    })
  })

  describe('cd', () => {
    it('renames name→cdName, cdValue→totalCost, interestRate→monthlyInterest', () => {
      const result = buildBuySubmitDetails('cd', {
        name: 'Bank CD',
        cdValue: 5000,
        interestRate: 25,
      })

      expect(result).toEqual({
        cdName: 'Bank CD',
        totalCost: 5000,
        monthlyInterest: 25,
      })
    })

    it('defaults missing fields to 0', () => {
      const result = buildBuySubmitDetails('cd', { name: 'CD' })

      expect(result).toEqual({
        cdName: 'CD',
        totalCost: 0,
        monthlyInterest: 0,
      })
    })
  })

  describe('real_estate', () => {
    it('renames fields and derives monthlyMortgage at 10%/12 of principal', () => {
      const result = buildBuySubmitDetails('real_estate', {
        name: '3/2 Rental',
        totalCost: 100000,
        downPayment: 20000,
        mortgageAmount: 80000,
        monthlyCashflow: 500,
      })

      expect(result).toEqual({
        propertyName: '3/2 Rental',
        price: 100000,
        downPayment: 20000,
        mortgageAmount: 80000,
        // 80000 * 0.1 / 12 = 666.66… rounded to 667
        monthlyMortgage: 667,
        monthlyRent: 500,
      })
    })

    it('derives monthlyMortgage = 0 when mortgageAmount is missing', () => {
      const result = buildBuySubmitDetails('real_estate', {
        name: 'Cash Buy',
        totalCost: 50000,
        downPayment: 50000,
        monthlyCashflow: 400,
      })

      expect(result).toEqual({
        propertyName: 'Cash Buy',
        price: 50000,
        downPayment: 50000,
        mortgageAmount: 0,
        monthlyMortgage: 0,
        monthlyRent: 400,
      })
    })
  })

  describe('gold', () => {
    it('renames name→goldType, costPerUnit→pricePerCoin, quantity→numCoins', () => {
      const result = buildBuySubmitDetails('gold', {
        name: 'Krugerrand',
        costPerUnit: 1800,
        quantity: 3,
      })

      expect(result).toEqual({
        goldType: 'Krugerrand',
        pricePerCoin: 1800,
        numCoins: 3,
      })
    })
  })

  describe('business', () => {
    it('derives loanAmount = max(0, businessCost - businessDownPayment)', () => {
      const result = buildBuySubmitDetails('business', {
        name: 'Laundromat',
        businessCost: 50000,
        businessDownPayment: 10000,
        businessCashflow: 700,
      })

      expect(result).toEqual({
        businessName: 'Laundromat',
        downPayment: 10000,
        loanAmount: 40000,
        // 40000 * 0.1 / 12 = 333.33… rounded to 333
        monthlyLoanPayment: 333,
        monthlyIncome: 700,
      })
    })

    it('derives loanAmount = 0 when down payment >= cost', () => {
      const result = buildBuySubmitDetails('business', {
        name: 'Cash-bought biz',
        businessCost: 20000,
        businessDownPayment: 20000,
        businessCashflow: 500,
      })

      expect(result).toMatchObject({
        downPayment: 20000,
        loanAmount: 0,
        monthlyLoanPayment: 0,
      })
    })

    it('clamps loanAmount to 0 if down payment exceeds cost', () => {
      const result = buildBuySubmitDetails('business', {
        name: 'Overpaid',
        businessCost: 1000,
        businessDownPayment: 5000,
        businessCashflow: 0,
      })

      expect(result).toMatchObject({
        loanAmount: 0,
        monthlyLoanPayment: 0,
      })
    })
  })

  it('throws on an unknown subType', () => {
    expect(() =>
      buildBuySubmitDetails(
        // Force an invalid subType through the type guard
        'crypto' as unknown as Parameters<typeof buildBuySubmitDetails>[0],
        { name: 'BTC' } as BuyFormDetails,
      ),
    ).toThrow(/Unknown buy subType/)
  })
})
