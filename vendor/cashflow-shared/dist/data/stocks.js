"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stocks = void 0;
exports.getAllStocks = getAllStocks;
exports.getStock = getStock;
exports.getRandomStock = getRandomStock;
exports.isValidStock = isValidStock;
exports.stocks = [
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
function getAllStocks() {
    return exports.stocks;
}
function getStock(ticker) {
    return exports.stocks.find((stock) => stock.ticker === ticker);
}
function getRandomStock() {
    return exports.stocks[Math.floor(Math.random() * exports.stocks.length)];
}
function isValidStock(ticker) {
    return exports.stocks.some((stock) => stock.ticker === ticker);
}
//# sourceMappingURL=stocks.js.map