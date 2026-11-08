"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotalIncome = calculateTotalIncome;
exports.calculateTotalExpenses = calculateTotalExpenses;
exports.calculatePaydayAmount = calculatePaydayAmount;
exports.calculateCashflow = calculateCashflow;
exports.calculatePassiveIncome = calculatePassiveIncome;
exports.checkFastTrackEligibility = checkFastTrackEligibility;
/**
 * Calculate total income (salary + passive income)
 */
function calculateTotalIncome(salary, passiveIncome) {
    const passiveTotal = calculatePassiveIncome(passiveIncome);
    return salary + passiveTotal;
}
/**
 * Calculate total monthly expenses including children
 */
function calculateTotalExpenses(expenses, numberOfChildren) {
    const baseExpenses = expenses.taxes +
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
function calculatePaydayAmount(totalIncome, totalExpenses) {
    return totalIncome - totalExpenses;
}
/**
 * Calculate cashflow (passive income - expenses)
 */
function calculateCashflow(passiveIncome, totalExpenses) {
    const passiveTotal = calculatePassiveIncome(passiveIncome);
    return passiveTotal - totalExpenses;
}
/**
 * Calculate total passive income
 */
function calculatePassiveIncome(passiveIncome) {
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
function checkFastTrackEligibility(passiveIncome, totalExpenses) {
    return passiveIncome > totalExpenses;
}
//# sourceMappingURL=core.js.map