import { IPlayer, IIncome, IExpense, ILiability, IProfessionData } from '../types/models';
import { getProfessionData } from './professions';

export function initializePlayerFromProfession(professionKey: string): Partial<IPlayer> {
  const professionData: IProfessionData = getProfessionData(professionKey);

  const income: IIncome = {
    salary: professionData.salary,
    passiveIncome: [],
  };

  const expenses: IExpense = {
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

  const liabilities: ILiability[] = professionData.liabilities.map((liability) => ({
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