export interface Stock {
  ticker: string
  fullName: string
  yieldOrROI: number
}

export const AVAILABLE_STOCKS: Stock[] = [
  {
    ticker: 'OK4U',
    fullName: 'OK4U Drug Co.',
    yieldOrROI: 0,
  },
  {
    ticker: 'ON2U',
    fullName: 'ON2U Entertainment Co.',
    yieldOrROI: 0,
  },
  {
    ticker: 'GRO4US',
    fullName: 'GRO4US Fund',
    yieldOrROI: 0,
  },
  {
    ticker: 'MYT4U',
    fullName: 'MYT4U Electronics Co.',
    yieldOrROI: 0,
  },
]

export const getStockByTicker = (ticker: string): Stock | undefined => {
  return AVAILABLE_STOCKS.find(stock => stock.ticker === ticker)
}

export const getStockDisplayName = (ticker: string): string => {
  const stock = getStockByTicker(ticker)
  return stock ? `${stock.ticker} - ${stock.fullName}` : ticker
}