import { stocks as sharedStocks } from '@cashflow/shared'
import type { IStock } from '@cashflow/shared'

/**
 * Frontend Stock type. Same shape as the shared `IStock` — re-exported as
 * `Stock` so existing call sites don't break. Data is now sourced directly
 * from `@cashflow/shared`; the previous hand-keyed copy is gone.
 */
export type Stock = IStock

export const AVAILABLE_STOCKS: Stock[] = sharedStocks

export const getStockByTicker = (ticker: string): Stock | undefined => {
  return AVAILABLE_STOCKS.find((stock) => stock.ticker === ticker)
}

export const getStockDisplayName = (ticker: string): string => {
  const stock = getStockByTicker(ticker)
  return stock ? `${stock.ticker} - ${stock.fullName}` : ticker
}
