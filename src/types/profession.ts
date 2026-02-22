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
}

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
