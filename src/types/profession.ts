// Frontend-specific Profession type
// The shared package has IProfessionData, but the frontend needs different fields
export interface Profession {
  id: string
  title: string
  salary: number
  taxes: number
  mortgage: number
  schoolLoan: number
  carLoan: number
  creditCard: number
  otherExpenses: number
  perChildExpense: number
  bankLoan: number
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  icon?: string

  // Fields from shared package that we'll add when integrating
  name?: string
  savings?: number
  retailPayment?: number
  childExpensePerChild?: number
  liabilities?: any[]
}

// Frontend-specific financial statement type for UI display
// The shared package has the actual data models, this is for UI presentation
export interface FinancialStatement {
  income: {
    salary: number
    interests: number
    dividends: number
    realEstate: number
    businesses: number
  }
  expenses: {
    taxes: number
    mortgage: number
    schoolLoan: number
    carLoan: number
    creditCard: number
    otherExpenses: number
    perChildExpense: number
    bankLoan: number
    numberOfChildren: number
  }
  assets: {
    savings: number
    stocks: Array<{ name: string; shares: number; costPerShare: number }>
    realEstate: Array<{ name: string; downPayment: number; cost: number; mortgage: number }>
    businesses: Array<{ name: string; downPayment: number; cost: number; liability: number }>
  }
  liabilities: {
    mortgage: number
    schoolLoans: number
    carLoans: number
    creditCardDebt: number
    bankLoan: number
    realEstateMortgages: number
    businessLiabilities: number
  }
}