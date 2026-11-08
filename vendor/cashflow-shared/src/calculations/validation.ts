import { ValidationResult } from '../types/calculations';
import { IAsset } from '../types/models';
import { LiabilityType } from '../enums';

/**
 * Validate if player has enough cash for a purchase
 */
export function validateBuyTransaction(
  cashOnHand: number,
  purchaseCost: number
): ValidationResult {
  if (purchaseCost < 0) {
    return {
      isValid: false,
      error: 'Purchase cost cannot be negative'
    };
  }

  if (cashOnHand < purchaseCost) {
    return {
      isValid: false,
      error: `Insufficient cash. Need $${purchaseCost.toLocaleString()}, have $${cashOnHand.toLocaleString()}`
    };
  }

  return { isValid: true };
}

/**
 * Validate loan amount (must be positive multiple of $1,000)
 */
export function validateLoanAmount(amount: number): ValidationResult {
  if (amount <= 0) {
    return {
      isValid: false,
      error: 'Loan amount must be positive'
    };
  }

  if (amount % 1000 !== 0) {
    return {
      isValid: false,
      error: 'Loan amount must be a multiple of $1,000'
    };
  }

  return { isValid: true };
}

/**
 * Validate payoff amount for a liability
 */
export function validatePayoffAmount(
  cashOnHand: number,
  liabilityBalance: number,
  amount: number,
  liabilityType: LiabilityType
): ValidationResult {
  if (amount <= 0) {
    return {
      isValid: false,
      error: 'Payoff amount must be positive'
    };
  }

  if (cashOnHand < amount) {
    return {
      isValid: false,
      error: `Insufficient cash. Need $${amount.toLocaleString()}, have $${cashOnHand.toLocaleString()}`
    };
  }

  if (amount > liabilityBalance) {
    return {
      isValid: false,
      error: `Cannot pay more than balance of $${liabilityBalance.toLocaleString()}`
    };
  }

  // Bank loans must be paid in $1,000 increments
  if (liabilityType === LiabilityType.BANK_LOAN && amount % 1000 !== 0) {
    return {
      isValid: false,
      error: 'Bank loan payments must be in $1,000 increments'
    };
  }

  return { isValid: true };
}

/**
 * Validate sell transaction
 */
export function validateSellTransaction(
  assets: IAsset[],
  assetId: string,
  quantity?: number
): ValidationResult {
  const asset = assets.find(a => String(a._id) === String(assetId));

  if (!asset) {
    return {
      isValid: false,
      error: 'Asset not found'
    };
  }

  if (quantity !== undefined) {
    if (quantity <= 0) {
      return {
        isValid: false,
        error: 'Quantity must be positive'
      };
    }

    if (quantity > asset.quantity) {
      return {
        isValid: false,
        error: `Cannot sell more than owned quantity of ${asset.quantity}`
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate doodad purchase amount
 */
export function validateDoodadAmount(
  cashOnHand: number,
  amount: number
): ValidationResult {
  if (amount <= 0) {
    return {
      isValid: false,
      error: 'Doodad amount must be positive'
    };
  }

  if (cashOnHand < amount) {
    return {
      isValid: false,
      error: `Insufficient cash for doodad. Need $${amount.toLocaleString()}, have $${cashOnHand.toLocaleString()}`
    };
  }

  return { isValid: true };
}