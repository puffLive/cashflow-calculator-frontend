import { TransactionType, MarketEventType } from '../enums';

/**
 * Convert transaction type to human-readable label
 */
export function formatTransactionType(type: TransactionType): string {
  const typeLabels: Record<TransactionType, string> = {
    [TransactionType.BUY]: 'Buy',
    [TransactionType.SELL]: 'Sell',
    [TransactionType.LOAN_TAKE]: 'Take Loan',
    [TransactionType.LOAN_PAYOFF]: 'Pay Off Loan',
    [TransactionType.PAYDAY]: 'Payday',
    [TransactionType.MARKET_EVENT]: 'Market Event',
    [TransactionType.UNDO]: 'Undo',
  };

  return typeLabels[type] || type;
}

/**
 * Convert market event subtype to human-readable label
 */
export function formatMarketEventType(subType: string): string {
  const eventLabels: Record<string, string> = {
    [MarketEventType.DOWNSIZED]: 'Downsized',
    [MarketEventType.CHARITY]: 'Charity',
    [MarketEventType.DOODAD]: 'Doodad',
    [MarketEventType.BABY]: 'Baby',
    [MarketEventType.STOCK_SPLIT]: 'Stock Split',
    [MarketEventType.REVERSE_STOCK_SPLIT]: 'Reverse Stock Split',
    [MarketEventType.LEND_COLLECT]: 'Lend/Collect',
  };

  return eventLabels[subType] || subType;
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
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
export function formatTransactionDisplay(type: TransactionType, subType?: string, description?: string): string {
  const typeLabel = formatTransactionType(type);

  if (type === TransactionType.MARKET_EVENT && subType) {
    const eventLabel = formatMarketEventType(subType);
    return description || eventLabel;
  }

  return description || typeLabel;
}
