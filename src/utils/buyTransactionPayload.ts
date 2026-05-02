/**
 * Translate the BuyTransactionScreen's TransactionDetails into the per-asset-
 * type field shape the backend's `submitBuyTransaction` controller expects.
 *
 * The frontend wizard uses generic field names (`name`, `numberOfShares`,
 * `costPerUnit`, etc.) for ergonomics. The backend's route validator
 * (`server/src/routes/transactionRoutes.ts`) and controller use type-specific
 * names (`stockName`, `numShares`, `pricePerCoin`, etc.). Without translation
 * the API returns 400 "Validation failed" for every buy submission.
 *
 * Both the field renames AND a couple of derivations live here:
 *  - Real estate: backend wants both `mortgageAmount` (principal) and
 *    `monthlyMortgage` (the monthly payment). The frontend only collects
 *    `mortgageAmount`, so we derive the payment at 10%/year ÷ 12 — the
 *    same formula the wizard's local impact preview already uses (see
 *    `BuyTransactionScreen::calculateImpact`).
 *  - Business: backend wants `loanAmount` and `monthlyLoanPayment` separately.
 *    The frontend collects `businessCost` + `businessDownPayment`; we derive
 *    `loanAmount = max(0, cost - downPayment)` and the monthly payment at
 *    the same 10%/12 rate.
 *  - Gold: backend's `submitBuyTransaction` falls back to "Krugerrand" if
 *    `goldType` is missing — but the frontend's wizard collects a name, so
 *    we pass it through under `goldType`.
 */

export type BuyAssetType =
  | 'stock'
  | 'mutual_fund'
  | 'cd'
  | 'real_estate'
  | 'gold'
  | 'business'

/** Mirror of `TransactionDetails` in BuyTransactionScreen. */
export interface BuyFormDetails {
  name: string
  pricePerShare?: number
  numberOfShares?: number
  dividendPerShare?: number
  cdValue?: number
  interestRate?: number
  totalCost?: number
  downPayment?: number
  mortgageAmount?: number
  monthlyCashflow?: number
  costPerUnit?: number
  quantity?: number
  businessCost?: number
  businessDownPayment?: number
  businessCashflow?: number
}

const ANNUAL_LOAN_RATE = 0.1
const MONTHS_PER_YEAR = 12

const monthlyPaymentFor = (principal: number): number =>
  Math.round((principal * ANNUAL_LOAN_RATE) / MONTHS_PER_YEAR)

export function buildBuySubmitDetails(
  subType: BuyAssetType,
  details: BuyFormDetails,
): Record<string, unknown> {
  switch (subType) {
    case 'stock':
      return {
        stockName: details.name,
        pricePerShare: details.pricePerShare ?? 0,
        numShares: details.numberOfShares ?? 0,
        ...(details.dividendPerShare !== undefined && {
          dividendPerShare: details.dividendPerShare,
        }),
      }

    case 'mutual_fund':
      return {
        fundName: details.name,
        pricePerShare: details.pricePerShare ?? 0,
        numShares: details.numberOfShares ?? 0,
        ...(details.dividendPerShare !== undefined && {
          dividendPerShare: details.dividendPerShare,
        }),
      }

    case 'cd':
      return {
        cdName: details.name,
        totalCost: details.cdValue ?? 0,
        monthlyInterest: details.interestRate ?? 0,
      }

    case 'real_estate': {
      const mortgageAmount = details.mortgageAmount ?? 0
      return {
        propertyName: details.name,
        price: details.totalCost ?? 0,
        downPayment: details.downPayment ?? 0,
        mortgageAmount,
        monthlyMortgage: monthlyPaymentFor(mortgageAmount),
        monthlyRent: details.monthlyCashflow ?? 0,
      }
    }

    case 'gold':
      return {
        goldType: details.name,
        pricePerCoin: details.costPerUnit ?? 0,
        numCoins: details.quantity ?? 0,
      }

    case 'business': {
      const cost = details.businessCost ?? 0
      const downPayment = details.businessDownPayment ?? 0
      const loanAmount = Math.max(0, cost - downPayment)
      return {
        businessName: details.name,
        downPayment,
        loanAmount,
        monthlyLoanPayment: monthlyPaymentFor(loanAmount),
        monthlyIncome: details.businessCashflow ?? 0,
      }
    }

    default: {
      // Should be unreachable because TS exhausts BuyAssetType — but guard
      // anyway so an unknown subType doesn't silently submit garbage.
      const _exhaustive: never = subType
      throw new Error(`Unknown buy subType: ${_exhaustive as string}`)
    }
  }
}
