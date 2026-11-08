import { IPassiveIncomeItem, IExpense } from '../types/models';
/**
 * Calculate total income (salary + passive income)
 */
export declare function calculateTotalIncome(salary: number, passiveIncome: IPassiveIncomeItem[]): number;
/**
 * Calculate total monthly expenses including children
 */
export declare function calculateTotalExpenses(expenses: IExpense, numberOfChildren: number): number;
/**
 * Calculate payday amount (income - expenses)
 */
export declare function calculatePaydayAmount(totalIncome: number, totalExpenses: number): number;
/**
 * Calculate cashflow (passive income - expenses)
 */
export declare function calculateCashflow(passiveIncome: IPassiveIncomeItem[], totalExpenses: number): number;
/**
 * Calculate total passive income
 */
export declare function calculatePassiveIncome(passiveIncome: IPassiveIncomeItem[]): number;
/**
 * Check if player is eligible for fast track
 * Player enters fast track when passive income > total expenses (strict greater than)
 */
export declare function checkFastTrackEligibility(passiveIncome: number, totalExpenses: number): boolean;
//# sourceMappingURL=core.d.ts.map