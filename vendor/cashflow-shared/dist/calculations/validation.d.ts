import { ValidationResult } from '../types/calculations';
import { IAsset } from '../types/models';
import { LiabilityType } from '../enums';
/**
 * Validate if player has enough cash for a purchase
 */
export declare function validateBuyTransaction(cashOnHand: number, purchaseCost: number): ValidationResult;
/**
 * Validate loan amount (must be positive multiple of $1,000)
 */
export declare function validateLoanAmount(amount: number): ValidationResult;
/**
 * Validate payoff amount for a liability
 */
export declare function validatePayoffAmount(cashOnHand: number, liabilityBalance: number, amount: number, liabilityType: LiabilityType): ValidationResult;
/**
 * Validate sell transaction
 */
export declare function validateSellTransaction(assets: IAsset[], assetId: string, quantity?: number): ValidationResult;
/**
 * Validate doodad purchase amount
 */
export declare function validateDoodadAmount(cashOnHand: number, amount: number): ValidationResult;
//# sourceMappingURL=validation.d.ts.map