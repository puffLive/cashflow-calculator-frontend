"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePlayerFromProfession = initializePlayerFromProfession;
const professions_1 = require("./professions");
function initializePlayerFromProfession(professionKey) {
    const professionData = (0, professions_1.getProfessionData)(professionKey);
    const income = {
        salary: professionData.salary,
        passiveIncome: [],
    };
    const expenses = {
        taxes: professionData.taxes,
        mortgage: professionData.mortgage,
        schoolLoan: professionData.schoolLoan,
        carLoan: professionData.carLoan,
        creditCard: professionData.creditCard,
        retailPayment: professionData.retailPayment,
        otherExpenses: professionData.otherExpenses,
        childExpensePerChild: professionData.childExpensePerChild,
        bankLoanPayment: 0,
    };
    const liabilities = professionData.liabilities.map((liability) => ({
        type: liability.type,
        name: liability.name,
        originalAmount: liability.originalAmount,
        currentBalance: liability.originalAmount, // Initialize with original amount
        monthlyPayment: liability.monthlyPayment,
    }));
    return {
        profession: professionData.name,
        cashOnHand: professionData.savings,
        salary: professionData.salary,
        numberOfChildren: 0,
        isOnFastTrack: false,
        income,
        expenses,
        assets: [],
        liabilities,
    };
}
//# sourceMappingURL=initializePlayer.js.map