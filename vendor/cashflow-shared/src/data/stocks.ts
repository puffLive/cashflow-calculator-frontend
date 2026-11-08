import { IStock } from '../types/models';

export const stocks: IStock[] = [
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
  {
    ticker: '2BIG',
    fullName: '2BIG Power',
    yieldOrROI: 0.1,
  },
];

export function getAllStocks(): IStock[] {
  return stocks;
}

export function getStock(ticker: string): IStock | undefined {
  return stocks.find((stock) => stock.ticker === ticker);
}

export function getRandomStock(): IStock {
  return stocks[Math.floor(Math.random() * stocks.length)];
}

export function isValidStock(ticker: string): boolean {
  return stocks.some((stock) => stock.ticker === ticker);
}