"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTransactionImpact = applyTransactionImpact;
exports.reverseTransactionImpact = reverseTransactionImpact;
/**
 * Map a liability type to the expense line its monthly payment lives on.
 * Returns null for liability types whose payments are NOT modeled as an
 * expense line: real-estate mortgages and business loans are netted into
 * the asset's monthly cashflow (see calculateBuyRealEstateImpact), so no
 * expense line ever carries them.
 */
function expenseFieldForLiabilityType(type) {
    switch (type) {
        case 'bank_loan':
            return 'bankLoanPayment';
        case 'mortgage':
            return 'mortgage';
        case 'car_loan':
            return 'carLoan';
        case 'student_loan':
            return 'schoolLoan';
        case 'credit_card':
            return 'creditCard';
        case 'retail_debt':
            return 'retailPayment';
        default:
            return null;
    }
}
/**
 * Apply a transaction impact to a player state
 * Returns a NEW player state object (pure function, no mutations)
 */
function applyTransactionImpact(playerState, impact) {
    // Clone the player state to avoid mutations
    const newState = JSON.parse(JSON.stringify(playerState));
    // Apply cash delta
    if (impact.cashDelta !== undefined) {
        newState.cashOnHand += impact.cashDelta;
    }
    // Apply children delta
    if (impact.childrenDelta !== undefined) {
        newState.numberOfChildren += impact.childrenDelta;
        // Recalculate child expenses (handled by the caller)
    }
    // Handle new asset
    if (impact.newAsset) {
        newState.assets.push(impact.newAsset);
        // Add passive income if applicable
        if (impact.newAsset.monthlyPassiveIncome > 0) {
            const passiveIncomeItem = {
                type: impact.newAsset.type,
                name: impact.newAsset.name,
                amount: impact.newAsset.monthlyPassiveIncome
            };
            newState.income.passiveIncome.push(passiveIncomeItem);
        }
    }
    // Handle updated asset
    if (impact.updatedAsset) {
        const assetIndex = newState.assets.findIndex(a => String(a._id) === String(impact.updatedAsset._id));
        if (assetIndex >= 0) {
            const oldAsset = newState.assets[assetIndex];
            newState.assets[assetIndex] = impact.updatedAsset;
            // Update passive income if changed
            if (oldAsset.monthlyPassiveIncome !== impact.updatedAsset.monthlyPassiveIncome) {
                const incomeIndex = newState.income.passiveIncome.findIndex(p => p.name === oldAsset.name && p.type === oldAsset.type);
                if (incomeIndex >= 0) {
                    if (impact.updatedAsset.monthlyPassiveIncome > 0) {
                        newState.income.passiveIncome[incomeIndex].amount = impact.updatedAsset.monthlyPassiveIncome;
                    }
                    else {
                        // Remove if no longer generating income
                        newState.income.passiveIncome.splice(incomeIndex, 1);
                    }
                }
            }
        }
    }
    // Handle removed asset
    if (impact.removedAssetId) {
        const assetIndex = newState.assets.findIndex(a => String(a._id) === String(impact.removedAssetId));
        if (assetIndex >= 0) {
            const removedAsset = newState.assets[assetIndex];
            newState.assets.splice(assetIndex, 1);
            // Remove associated passive income
            if (removedAsset.monthlyPassiveIncome > 0) {
                const incomeIndex = newState.income.passiveIncome.findIndex(p => p.name === removedAsset.name && p.type === removedAsset.type);
                if (incomeIndex >= 0) {
                    newState.income.passiveIncome.splice(incomeIndex, 1);
                }
            }
        }
    }
    // Handle new liability.
    // NOTE: the expense-line change for a liability payment is carried by
    // `expenseDelta` and routed below — do NOT also bump the line here, or
    // the payment gets double-counted (the pre-fix behavior: a $2,000 loan
    // raised expenses by $400 instead of $200).
    let touchedLiabilityType;
    if (impact.newLiability) {
        newState.liabilities.push(impact.newLiability);
        touchedLiabilityType = impact.newLiability.type;
    }
    // Handle updated liability
    if (impact.updatedLiability) {
        const liabilityIndex = newState.liabilities.findIndex(l => String(l._id) === String(impact.updatedLiability._id));
        if (liabilityIndex >= 0) {
            newState.liabilities[liabilityIndex] = impact.updatedLiability;
            touchedLiabilityType = impact.updatedLiability.type;
        }
    }
    // Handle removed liability
    if (impact.removedLiabilityId) {
        const liabilityIndex = newState.liabilities.findIndex(l => String(l._id) === String(impact.removedLiabilityId));
        if (liabilityIndex >= 0) {
            const removedLiability = newState.liabilities[liabilityIndex];
            newState.liabilities.splice(liabilityIndex, 1);
            touchedLiabilityType = removedLiability.type;
        }
    }
    // Apply passive income delta (for simple adjustments)
    if (impact.passiveIncomeDelta !== undefined && impact.passiveIncomeDelta !== 0) {
        // This is handled by asset additions/removals above
        // This field is mainly for tracking purposes
    }
    // Apply the expense delta ONCE, on the line it belongs to:
    //  - the impact touched a liability with an expense line → that line
    //  - the impact touched a real-estate mortgage / business loan → skip
    //    (their payments are netted into the asset's monthly cashflow, never
    //    an expense line — see calculateBuyRealEstateImpact)
    //  - no liability involved → genuine miscellaneous expense → otherExpenses
    if (impact.expenseDelta !== undefined && impact.expenseDelta !== 0) {
        if (touchedLiabilityType !== undefined) {
            const field = expenseFieldForLiabilityType(touchedLiabilityType);
            if (field) {
                newState.expenses[field] = Math.max(0, newState.expenses[field] + impact.expenseDelta);
            }
            // null field (real_estate_mortgage / business_loan): intentionally no-op
        }
        else {
            newState.expenses.otherExpenses = Math.max(0, newState.expenses.otherExpenses + impact.expenseDelta);
        }
    }
    return newState;
}
/**
 * Reverse a transaction impact to create an undo impact
 */
function reverseTransactionImpact(impact) {
    const reversedImpact = {
        description: `Undo: ${impact.description || 'transaction'}`
    };
    // Reverse cash delta
    if (impact.cashDelta !== undefined) {
        reversedImpact.cashDelta = -impact.cashDelta;
    }
    // Reverse children delta
    if (impact.childrenDelta !== undefined) {
        reversedImpact.childrenDelta = -impact.childrenDelta;
    }
    // Reverse asset operations
    if (impact.newAsset) {
        // If we added an asset, we need to remove it
        reversedImpact.removedAssetId = impact.newAsset._id;
    }
    if (impact.removedAssetId) {
        // If we removed an asset, we'd need to add it back
        // This requires storing the original asset data, which isn't in the impact
        // In a real implementation, you'd need to store the original asset
        throw new Error('Cannot reverse asset removal without original asset data');
    }
    if (impact.updatedAsset) {
        // If we updated an asset, we'd need the original state
        // This requires storing the original asset data
        throw new Error('Cannot reverse asset update without original asset data');
    }
    // Reverse liability operations
    if (impact.newLiability) {
        // If we added a liability, we need to remove it
        reversedImpact.removedLiabilityId = impact.newLiability._id;
    }
    if (impact.removedLiabilityId) {
        // If we removed a liability, we'd need to add it back
        throw new Error('Cannot reverse liability removal without original liability data');
    }
    if (impact.updatedLiability) {
        // If we updated a liability, we'd need the original state
        throw new Error('Cannot reverse liability update without original liability data');
    }
    // Reverse passive income delta
    if (impact.passiveIncomeDelta !== undefined) {
        reversedImpact.passiveIncomeDelta = -impact.passiveIncomeDelta;
    }
    // Reverse expense delta
    if (impact.expenseDelta !== undefined) {
        reversedImpact.expenseDelta = -impact.expenseDelta;
    }
    // Note: Capital gain cannot be reversed (it's informational only)
    return reversedImpact;
}
//# sourceMappingURL=impact.js.map