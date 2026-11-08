import { IAsset, ILiability, IExpense, IPassiveIncomeItem } from './models';
import { AssetType, LiabilityType } from '../enums';

// Validation Results
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Transaction Impact Types
export interface TransactionImpact {
  cashDelta?: number;
  passiveIncomeDelta?: number;
  expenseDelta?: number;
  childrenDelta?: number;
  newAsset?: IAsset;
  updatedAsset?: IAsset;
  removedAssetId?: string;
  newLiability?: ILiability;
  updatedLiability?: ILiability;
  removedLiabilityId?: string;
  removedPassiveIncome?: IPassiveIncomeItem[];
  removedExpense?: Partial<IExpense>;
  capitalGain?: number;
  requiresLoan?: boolean;
  description?: string;
}

// Buy Transaction Parameters
export interface BuyStockParams {
  stockName: string;
  pricePerShare: number;
  numShares: number;
  dividendPerShare?: number;
}

export interface BuyMutualFundParams {
  fundName: string;
  pricePerShare: number;
  numShares: number;
  dividendPerShare?: number;
}

export interface BuyCDParams {
  cdValue: number;
  interestRate: number;
}

export interface BuyRealEstateParams {
  name: string;
  cost: number;
  downPayment: number;
  mortgageAmount: number;
  monthlyCashflow: number;
  mortgagePayment: number;
}

export interface BuyGoldParams {
  type: string;
  costPerUnit: number;
  quantity: number;
}

export interface BuyBusinessParams {
  name: string;
  cost: number;
  downPayment: number;
  loanAmount?: number;
  monthlyCashflow: number;
  loanPayment?: number;
}

// Sell Transaction Parameters
export interface SellAssetParams {
  assetId: string;
  salePrice: number;
  quantity?: number;
}

// Loan Transaction Parameters
export interface TakeLoanParams {
  amountIn1000s: number;
}

export interface PayOffLoanParams {
  liabilityId: string;
  payoffAmount: number;
}

// Market Event Parameters
export interface DoodadParams {
  amount: number;
}

export interface StockSplitParams {
  assetId: string;
}

export interface LendCollectParams {
  amount: number; // positive for collect, negative for lend
}