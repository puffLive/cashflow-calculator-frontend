"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBuyStockImpact = calculateBuyStockImpact;
exports.calculateBuyMutualFundImpact = calculateBuyMutualFundImpact;
exports.calculateBuyCDImpact = calculateBuyCDImpact;
exports.calculateBuyRealEstateImpact = calculateBuyRealEstateImpact;
exports.calculateBuyGoldImpact = calculateBuyGoldImpact;
exports.calculateBuyBusinessImpact = calculateBuyBusinessImpact;
exports.calculateSellAssetImpact = calculateSellAssetImpact;
exports.calculateTakeLoanImpact = calculateTakeLoanImpact;
exports.calculatePayOffLoanImpact = calculatePayOffLoanImpact;
exports.calculateDownsizedImpact = calculateDownsizedImpact;
exports.calculateCharityImpact = calculateCharityImpact;
exports.calculateDoodadImpact = calculateDoodadImpact;
exports.calculateBabyImpact = calculateBabyImpact;
exports.calculateStockSplitImpact = calculateStockSplitImpact;
exports.calculateReverseStockSplitImpact = calculateReverseStockSplitImpact;
exports.calculateLendCollectImpact = calculateLendCollectImpact;
const enums_1 = require("../enums");
const core_1 = require("./core");
/**
 * Generate a unique ID for new assets/liabilities (simplified for now)
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
/**
 * Calculate impact of buying stock
 */
function calculateBuyStockImpact(state, params) {
    const totalCost = params.pricePerShare * params.numShares;
    const monthlyDividend = params.dividendPerShare
        ? params.dividendPerShare * params.numShares
        : 0;
    const newAsset = {
        _id: generateId(),
        type: enums_1.AssetType.STOCK,
        name: params.stockName,
        costPerUnit: params.pricePerShare,
        quantity: params.numShares,
        totalCost,
        monthlyPassiveIncome: monthlyDividend,
        purchasedAt: new Date()
    };
    const impact = {
        cashDelta: -totalCost,
        newAsset,
        description: `Bought ${params.numShares} shares of ${params.stockName}`
    };
    if (monthlyDividend > 0) {
        impact.passiveIncomeDelta = monthlyDividend;
    }
    return impact;
}
/**
 * Calculate impact of buying mutual fund
 */
function calculateBuyMutualFundImpact(state, params) {
    const totalCost = params.pricePerShare * params.numShares;
    const monthlyDividend = params.dividendPerShare
        ? params.dividendPerShare * params.numShares
        : 0;
    const newAsset = {
        _id: generateId(),
        type: enums_1.AssetType.MUTUAL_FUND,
        name: params.fundName,
        costPerUnit: params.pricePerShare,
        quantity: params.numShares,
        totalCost,
        monthlyPassiveIncome: monthlyDividend,
        purchasedAt: new Date()
    };
    const impact = {
        cashDelta: -totalCost,
        newAsset,
        description: `Bought ${params.numShares} shares of ${params.fundName} mutual fund`
    };
    if (monthlyDividend > 0) {
        impact.passiveIncomeDelta = monthlyDividend;
    }
    return impact;
}
/**
 * Calculate impact of buying CD
 */
function calculateBuyCDImpact(state, params) {
    const monthlyInterest = Math.floor(params.cdValue * (params.interestRate / 100) / 12);
    const newAsset = {
        _id: generateId(),
        type: enums_1.AssetType.CD,
        name: `CD @ ${params.interestRate}%`,
        costPerUnit: params.cdValue,
        quantity: 1,
        totalCost: params.cdValue,
        monthlyPassiveIncome: monthlyInterest,
        purchasedAt: new Date()
    };
    return {
        cashDelta: -params.cdValue,
        passiveIncomeDelta: monthlyInterest,
        newAsset,
        description: `Bought CD worth $${params.cdValue.toLocaleString()} at ${params.interestRate}%`
    };
}
/**
 * Calculate impact of buying real estate
 */
function calculateBuyRealEstateImpact(state, params) {
    const assetId = generateId();
    const liabilityId = generateId();
    const newAsset = {
        _id: assetId,
        type: enums_1.AssetType.REAL_ESTATE,
        name: params.name,
        costPerUnit: params.cost,
        quantity: 1,
        totalCost: params.cost,
        monthlyPassiveIncome: params.monthlyCashflow,
        associatedLiabilityId: liabilityId,
        purchasedAt: new Date()
    };
    const newLiability = {
        _id: liabilityId,
        type: enums_1.LiabilityType.REAL_ESTATE_MORTGAGE,
        name: `Mortgage - ${params.name}`,
        originalAmount: params.mortgageAmount,
        currentBalance: params.mortgageAmount,
        monthlyPayment: params.mortgagePayment,
        associatedAssetId: assetId
    };
    // Per Cashflow 101 rules, an investment property's "Cash Flow" on the
    // card is NET (rent − mortgage). The mortgage stays a liability; it is
    // NOT an income-statement expense line (only the player's personal-home
    // mortgage goes there). So `monthlyCashflow` IS the player's passive
    // income contribution from this property — no separate `expenseDelta`.
    return {
        cashDelta: -params.downPayment,
        passiveIncomeDelta: params.monthlyCashflow,
        newAsset,
        newLiability,
        description: `Bought real estate: ${params.name}`
    };
}
/**
 * Calculate impact of buying gold
 */
function calculateBuyGoldImpact(state, params) {
    const totalCost = params.costPerUnit * params.quantity;
    const newAsset = {
        _id: generateId(),
        type: enums_1.AssetType.GOLD,
        name: params.type,
        costPerUnit: params.costPerUnit,
        quantity: params.quantity,
        totalCost,
        monthlyPassiveIncome: 0, // Gold doesn't generate passive income
        purchasedAt: new Date()
    };
    return {
        cashDelta: -totalCost,
        newAsset,
        description: `Bought ${params.quantity} units of ${params.type}`
    };
}
/**
 * Calculate impact of buying business
 */
function calculateBuyBusinessImpact(state, params) {
    const assetId = generateId();
    const newAsset = {
        _id: assetId,
        type: enums_1.AssetType.BUSINESS,
        name: params.name,
        costPerUnit: params.cost,
        quantity: 1,
        totalCost: params.cost,
        monthlyPassiveIncome: params.monthlyCashflow,
        purchasedAt: new Date()
    };
    const impact = {
        cashDelta: -params.downPayment,
        passiveIncomeDelta: params.monthlyCashflow,
        newAsset,
        description: `Bought business: ${params.name}`
    };
    // Add business loan if needed
    if (params.loanAmount && params.loanAmount > 0) {
        const liabilityId = generateId();
        const newLiability = {
            _id: liabilityId,
            type: enums_1.LiabilityType.BUSINESS_LOAN,
            name: `Business Loan - ${params.name}`,
            originalAmount: params.loanAmount,
            currentBalance: params.loanAmount,
            monthlyPayment: params.loanPayment || 0,
            associatedAssetId: assetId
        };
        newAsset.associatedLiabilityId = liabilityId;
        impact.newLiability = newLiability;
        // `monthlyCashflow` is already the NET (revenue − loan payment), so the
        // business loan stays a liability only — no separate expense line. See
        // the matching comment in `calculateBuyRealEstateImpact`.
    }
    return impact;
}
/**
 * Calculate impact of selling an asset
 */
function calculateSellAssetImpact(state, params) {
    const asset = state.assets.find(a => String(a._id) === String(params.assetId));
    if (!asset) {
        throw new Error('Asset not found');
    }
    const quantityToSell = params.quantity || asset.quantity;
    const isFullSale = quantityToSell >= asset.quantity;
    const impact = {
        cashDelta: params.salePrice,
        description: `Sold ${isFullSale ? 'all' : quantityToSell} ${asset.name}`
    };
    // Calculate capital gain
    const costBasis = (asset.totalCost / asset.quantity) * quantityToSell;
    impact.capitalGain = params.salePrice - costBasis;
    if (isFullSale) {
        // Remove entire asset
        impact.removedAssetId = asset._id;
        // Remove associated passive income
        if (asset.monthlyPassiveIncome > 0) {
            impact.passiveIncomeDelta = -asset.monthlyPassiveIncome;
        }
        // Handle associated liability (for real estate or business).
        // The outstanding balance is paid off out of the sale proceeds, so the
        // seller nets salePrice − currentBalance (previously the full gross
        // price was paid out AND the debt deleted — free money on every
        // leveraged sale). No expenseDelta: these payments were netted into the
        // asset's monthly cashflow at purchase, never added as an expense line.
        if (asset.associatedLiabilityId) {
            const liability = state.liabilities.find(l => String(l._id) === String(asset.associatedLiabilityId));
            if (liability) {
                impact.removedLiabilityId = liability._id;
                impact.cashDelta = params.salePrice - liability.currentBalance;
            }
        }
    }
    else {
        // Partial sale - update asset quantity
        const remainingQuantity = asset.quantity - quantityToSell;
        const newCostPerUnit = asset.costPerUnit;
        const newTotalCost = newCostPerUnit * remainingQuantity;
        const newPassiveIncome = asset.monthlyPassiveIncome
            ? (asset.monthlyPassiveIncome / asset.quantity) * remainingQuantity
            : 0;
        impact.updatedAsset = {
            ...asset,
            quantity: remainingQuantity,
            totalCost: newTotalCost,
            monthlyPassiveIncome: newPassiveIncome
        };
        if (asset.monthlyPassiveIncome > 0) {
            const passiveIncomeReduction = asset.monthlyPassiveIncome - newPassiveIncome;
            impact.passiveIncomeDelta = -passiveIncomeReduction;
        }
    }
    return impact;
}
/**
 * Calculate impact of taking out a loan
 */
function calculateTakeLoanImpact(state, params) {
    const loanAmount = params.amountIn1000s * 1000;
    const monthlyPayment = params.amountIn1000s * 100; // $100 per $1,000
    // Check if player already has a bank loan
    const existingLoan = state.liabilities.find(l => l.type === enums_1.LiabilityType.BANK_LOAN);
    if (existingLoan) {
        // Update existing loan
        const updatedLiability = {
            ...existingLoan,
            currentBalance: existingLoan.currentBalance + loanAmount,
            originalAmount: existingLoan.originalAmount + loanAmount,
            monthlyPayment: existingLoan.monthlyPayment + monthlyPayment
        };
        return {
            cashDelta: loanAmount,
            expenseDelta: monthlyPayment,
            updatedLiability,
            description: `Took additional bank loan of $${loanAmount.toLocaleString()}`
        };
    }
    else {
        // Create new bank loan
        const newLiability = {
            _id: generateId(),
            type: enums_1.LiabilityType.BANK_LOAN,
            name: 'Bank Loan',
            originalAmount: loanAmount,
            currentBalance: loanAmount,
            monthlyPayment
        };
        return {
            cashDelta: loanAmount,
            expenseDelta: monthlyPayment,
            newLiability,
            description: `Took bank loan of $${loanAmount.toLocaleString()}`
        };
    }
}
/**
 * Calculate impact of paying off a loan
 */
function calculatePayOffLoanImpact(state, params) {
    const liability = state.liabilities.find(l => String(l._id) === String(params.liabilityId));
    if (!liability) {
        throw new Error('Liability not found');
    }
    const isFullPayoff = params.payoffAmount >= liability.currentBalance;
    // Real-estate mortgages and business loans are netted into the asset's
    // monthly cashflow — their payments were never added as an expense line,
    // so paying them off must not remove one either.
    const paymentIsExpenseLine = liability.type !== enums_1.LiabilityType.REAL_ESTATE_MORTGAGE &&
        liability.type !== enums_1.LiabilityType.BUSINESS_LOAN;
    const impact = {
        cashDelta: -params.payoffAmount,
        description: `${isFullPayoff ? 'Paid off' : 'Paid down'} ${liability.name}`
    };
    if (isFullPayoff) {
        // Remove liability completely
        impact.removedLiabilityId = liability._id;
        if (paymentIsExpenseLine) {
            impact.expenseDelta = -liability.monthlyPayment;
        }
    }
    else {
        // Partial payoff
        const newBalance = liability.currentBalance - params.payoffAmount;
        // For bank loans, recalculate monthly payment
        let newMonthlyPayment = liability.monthlyPayment;
        if (liability.type === enums_1.LiabilityType.BANK_LOAN) {
            // Bank loan: $100 per $1,000 of balance
            newMonthlyPayment = Math.floor(newBalance / 1000) * 100;
        }
        impact.updatedLiability = {
            ...liability,
            currentBalance: newBalance,
            monthlyPayment: newMonthlyPayment
        };
        if (paymentIsExpenseLine && newMonthlyPayment !== liability.monthlyPayment) {
            impact.expenseDelta = newMonthlyPayment - liability.monthlyPayment;
        }
    }
    return impact;
}
/**
 * Calculate impact of being downsized
 */
function calculateDownsizedImpact(state) {
    const totalExpenses = (0, core_1.calculateTotalExpenses)(state.expenses, state.numberOfChildren);
    const newCash = state.cashOnHand - totalExpenses;
    return {
        cashDelta: -totalExpenses,
        requiresLoan: newCash < 0,
        description: `Downsized! Lost $${totalExpenses.toLocaleString()}`
    };
}
/**
 * Calculate impact of charity donation
 */
function calculateCharityImpact(state) {
    const totalIncome = (0, core_1.calculateTotalIncome)(state.salary, state.income.passiveIncome);
    const charityAmount = Math.floor(totalIncome * 0.1); // 10% of total income
    return {
        cashDelta: -charityAmount,
        description: `Donated $${charityAmount.toLocaleString()} to charity (10% of income)`
    };
}
/**
 * Calculate impact of doodad purchase
 */
function calculateDoodadImpact(state, params) {
    return {
        cashDelta: -params.amount,
        description: `Bought doodad for $${params.amount.toLocaleString()}`
    };
}
/**
 * Calculate impact of having a baby
 */
function calculateBabyImpact(state) {
    return {
        childrenDelta: 1,
        description: 'Had a baby!'
    };
}
/**
 * Calculate impact of stock split
 */
function calculateStockSplitImpact(state, params) {
    const asset = state.assets.find(a => String(a._id) === String(params.assetId));
    if (!asset) {
        throw new Error('Asset not found');
    }
    if (asset.type !== enums_1.AssetType.STOCK) {
        throw new Error('Stock split can only be applied to stocks');
    }
    const updatedAsset = {
        ...asset,
        quantity: asset.quantity * 2,
        costPerUnit: asset.costPerUnit / 2
    };
    return {
        updatedAsset,
        description: `Stock split for ${asset.name} (2:1)`
    };
}
/**
 * Calculate impact of reverse stock split
 */
function calculateReverseStockSplitImpact(state, params) {
    const asset = state.assets.find(a => String(a._id) === String(params.assetId));
    if (!asset) {
        throw new Error('Asset not found');
    }
    if (asset.type !== enums_1.AssetType.STOCK) {
        throw new Error('Stock split can only be applied to stocks');
    }
    const updatedAsset = {
        ...asset,
        quantity: Math.floor(asset.quantity / 2), // Floor for odd quantities
        costPerUnit: asset.costPerUnit * 2
    };
    return {
        updatedAsset,
        description: `Reverse stock split for ${asset.name} (1:2)`
    };
}
/**
 * Calculate impact of lending or collecting money
 */
function calculateLendCollectImpact(state, params) {
    const isLending = params.amount < 0;
    return {
        cashDelta: params.amount,
        description: isLending
            ? `Lent $${Math.abs(params.amount).toLocaleString()}`
            : `Collected $${params.amount.toLocaleString()}`
    };
}
//# sourceMappingURL=transactions.js.map