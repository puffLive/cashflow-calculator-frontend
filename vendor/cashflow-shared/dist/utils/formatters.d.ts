import { TransactionType } from '../enums';
/**
 * Convert transaction type to human-readable label
 */
export declare function formatTransactionType(type: TransactionType): string;
/**
 * Convert market event subtype to human-readable label
 */
export declare function formatMarketEventType(subType: string): string;
/**
 * Format currency value
 */
export declare function formatCurrency(amount: number): string;
/**
 * Format a transaction for display with type and description
 */
export declare function formatTransactionDisplay(type: TransactionType, subType?: string, description?: string): string;
//# sourceMappingURL=formatters.d.ts.map