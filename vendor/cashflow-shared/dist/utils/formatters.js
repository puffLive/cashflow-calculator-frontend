"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTransactionType = formatTransactionType;
exports.formatMarketEventType = formatMarketEventType;
exports.formatCurrency = formatCurrency;
exports.formatTransactionDisplay = formatTransactionDisplay;
const enums_1 = require("../enums");
/**
 * Convert transaction type to human-readable label
 */
function formatTransactionType(type) {
    const typeLabels = {
        [enums_1.TransactionType.BUY]: 'Buy',
        [enums_1.TransactionType.SELL]: 'Sell',
        [enums_1.TransactionType.LOAN_TAKE]: 'Take Loan',
        [enums_1.TransactionType.LOAN_PAYOFF]: 'Pay Off Loan',
        [enums_1.TransactionType.PAYDAY]: 'Payday',
        [enums_1.TransactionType.MARKET_EVENT]: 'Market Event',
        [enums_1.TransactionType.UNDO]: 'Undo',
    };
    return typeLabels[type] || type;
}
/**
 * Convert market event subtype to human-readable label
 */
function formatMarketEventType(subType) {
    const eventLabels = {
        [enums_1.MarketEventType.DOWNSIZED]: 'Downsized',
        [enums_1.MarketEventType.CHARITY]: 'Charity',
        [enums_1.MarketEventType.DOODAD]: 'Doodad',
        [enums_1.MarketEventType.BABY]: 'Baby',
        [enums_1.MarketEventType.STOCK_SPLIT]: 'Stock Split',
        [enums_1.MarketEventType.REVERSE_STOCK_SPLIT]: 'Reverse Stock Split',
        [enums_1.MarketEventType.LEND_COLLECT]: 'Lend/Collect',
    };
    return eventLabels[subType] || subType;
}
/**
 * Format currency value
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
/**
 * Format a transaction for display with type and description
 */
function formatTransactionDisplay(type, subType, description) {
    const typeLabel = formatTransactionType(type);
    if (type === enums_1.TransactionType.MARKET_EVENT && subType) {
        const eventLabel = formatMarketEventType(subType);
        return description || eventLabel;
    }
    return description || typeLabel;
}
//# sourceMappingURL=formatters.js.map