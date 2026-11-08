"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBuyTransaction = validateBuyTransaction;
exports.validateLoanAmount = validateLoanAmount;
exports.validatePayoffAmount = validatePayoffAmount;
exports.validateSellTransaction = validateSellTransaction;
exports.validateDoodadAmount = validateDoodadAmount;
const enums_1 = require("../enums");
/**
 * Validate if player has enough cash for a purchase
 */
function validateBuyTransaction(cashOnHand, purchaseCost) {
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
function validateLoanAmount(amount) {
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
function validatePayoffAmount(cashOnHand, liabilityBalance, amount, liabilityType) {
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
    if (liabilityType === enums_1.LiabilityType.BANK_LOAN && amount % 1000 !== 0) {
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
function validateSellTransaction(assets, assetId, quantity) {
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
function validateDoodadAmount(cashOnHand, amount) {
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
//# sourceMappingURL=validation.js.map