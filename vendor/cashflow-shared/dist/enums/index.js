"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketEventType = exports.LiabilityType = exports.AssetType = exports.AuditStatus = exports.TransactionType = exports.ConnectionStatus = exports.GameStatus = void 0;
var GameStatus;
(function (GameStatus) {
    GameStatus["LOBBY"] = "lobby";
    GameStatus["ACTIVE"] = "active";
    GameStatus["COMPLETED"] = "completed";
    GameStatus["ARCHIVED"] = "archived";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["CONNECTED"] = "connected";
    ConnectionStatus["DISCONNECTED"] = "disconnected";
    ConnectionStatus["REMOVED"] = "removed";
})(ConnectionStatus || (exports.ConnectionStatus = ConnectionStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["BUY"] = "buy";
    TransactionType["SELL"] = "sell";
    TransactionType["LOAN_TAKE"] = "loan_take";
    TransactionType["LOAN_PAYOFF"] = "loan_payoff";
    TransactionType["PAYDAY"] = "payday";
    TransactionType["MARKET_EVENT"] = "market_event";
    TransactionType["UNDO"] = "undo";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var AuditStatus;
(function (AuditStatus) {
    AuditStatus["PENDING"] = "pending";
    AuditStatus["APPROVED"] = "approved";
    AuditStatus["REJECTED"] = "rejected";
    AuditStatus["NOT_REQUIRED"] = "not_required";
})(AuditStatus || (exports.AuditStatus = AuditStatus = {}));
var AssetType;
(function (AssetType) {
    AssetType["STOCK"] = "stock";
    AssetType["MUTUAL_FUND"] = "mutual_fund";
    AssetType["CD"] = "cd";
    AssetType["REAL_ESTATE"] = "real_estate";
    AssetType["GOLD"] = "gold";
    AssetType["BUSINESS"] = "business";
})(AssetType || (exports.AssetType = AssetType = {}));
var LiabilityType;
(function (LiabilityType) {
    LiabilityType["BANK_LOAN"] = "bank_loan";
    LiabilityType["MORTGAGE"] = "mortgage";
    LiabilityType["CAR_LOAN"] = "car_loan";
    LiabilityType["STUDENT_LOAN"] = "student_loan";
    LiabilityType["CREDIT_CARD"] = "credit_card";
    LiabilityType["RETAIL_DEBT"] = "retail_debt";
    LiabilityType["REAL_ESTATE_MORTGAGE"] = "real_estate_mortgage";
    LiabilityType["BUSINESS_LOAN"] = "business_loan";
})(LiabilityType || (exports.LiabilityType = LiabilityType = {}));
var MarketEventType;
(function (MarketEventType) {
    MarketEventType["DOWNSIZED"] = "downsized";
    MarketEventType["CHARITY"] = "charity";
    MarketEventType["DOODAD"] = "doodad";
    MarketEventType["BABY"] = "baby";
    MarketEventType["STOCK_SPLIT"] = "stock_split";
    MarketEventType["REVERSE_STOCK_SPLIT"] = "reverse_stock_split";
    MarketEventType["LEND_COLLECT"] = "lend_collect";
})(MarketEventType || (exports.MarketEventType = MarketEventType = {}));
//# sourceMappingURL=index.js.map