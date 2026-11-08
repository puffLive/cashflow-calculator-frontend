import { IPassiveIncomeItem, IExpense } from '../types/models';

/**
 * Calculate total income (salary + passive income)
 */
export function calculateTotalIncome(
  salary: number,
  passiveIncome: IPassiveIncomeItem[]
): number {
  const passiveTotal = calculatePassiveIncome(passiveIncome);
  return salary + passiveTotal;
}

/**
 * Calculate total monthly expenses including children
 */
export function calculateTotalExpenses(
  expenses: IExpense,
  numberOfChildren: number
): number {
  const baseExpenses =
    expenses.taxes +
    expenses.mortgage +
    expenses.schoolLoan +
    expenses.carLoan +
    expenses.creditCard +
    expenses.retailPayment +
    expenses.otherExpenses +
    expenses.bankLoanPayment;

  const childExpenses = expenses.childExpensePerChild * numberOfChildren;

  return baseExpenses + childExpenses;
}

/**
 * Calculate payday amount (income - expenses)
 */
export function calculatePaydayAmount(
  totalIncome: number,
  totalExpenses: number
): number {
  return totalIncome - totalExpenses;
}

/**
 * Calculate cashflow (passive income - expenses)
 */
export function calculateCashflow(
  passiveIncome: IPassiveIncomeItem[],
  totalExpenses: number
): number {
  const passiveTotal = calculatePassiveIncome(passiveIncome);
  return passiveTotal - totalExpenses;
}

/**
 * Calculate total passive income
 */
export function calculatePassiveIncome(
  passiveIncome: IPassiveIncomeItem[]
): number {
  if (!passiveIncome || passiveIncome.length === 0) {
    return 0;
  }

  return passiveIncome.reduce((total, item) => {
    return total + (item.amount || 0);
  }, 0);
}

/**
 * Check if player is eligible for fast track
 * Player enters fast track when passive income > total expenses (strict greater than)
 */
export function checkFastTrackEligibility(
  passiveIncome: number,
  totalExpenses: number
): boolean {
  return passiveIncome > totalExpenses;
}