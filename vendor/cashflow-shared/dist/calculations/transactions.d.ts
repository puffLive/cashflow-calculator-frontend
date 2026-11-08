import { TransactionImpact, BuyStockParams, BuyMutualFundParams, BuyCDParams, BuyRealEstateParams, BuyGoldParams, BuyBusinessParams, SellAssetParams, TakeLoanParams, PayOffLoanParams, DoodadParams, StockSplitParams, LendCollectParams } from '../types/calculations';
import { IPlayer } from '../types/models';
/**
 * Calculate impact of buying stock
 */
export declare function calculateBuyStockImpact(state: IPlayer, params: BuyStockParams): TransactionImpact;
/**
 * Calculate impact of buying mutual fund
 */
export declare function calculateBuyMutualFundImpact(state: IPlayer, params: BuyMutualFundParams): TransactionImpact;
/**
 * Calculate impact of buying CD
 */
export declare function calculateBuyCDImpact(state: IPlayer, params: BuyCDParams): TransactionImpact;
/**
 * Calculate impact of buying real estate
 */
export declare function calculateBuyRealEstateImpact(state: IPlayer, params: BuyRealEstateParams): TransactionImpact;
/**
 * Calculate impact of buying gold
 */
export declare function calculateBuyGoldImpact(state: IPlayer, params: BuyGoldParams): TransactionImpact;
/**
 * Calculate impact of buying business
 */
export declare function calculateBuyBusinessImpact(state: IPlayer, params: BuyBusinessParams): TransactionImpact;
/**
 * Calculate impact of selling an asset
 */
export declare function calculateSellAssetImpact(state: IPlayer, params: SellAssetParams): TransactionImpact;
/**
 * Calculate impact of taking out a loan
 */
export declare function calculateTakeLoanImpact(state: IPlayer, params: TakeLoanParams): TransactionImpact;
/**
 * Calculate impact of paying off a loan
 */
export declare function calculatePayOffLoanImpact(state: IPlayer, params: PayOffLoanParams): TransactionImpact;
/**
 * Calculate impact of being downsized
 */
export declare function calculateDownsizedImpact(state: IPlayer): TransactionImpact;
/**
 * Calculate impact of charity donation
 */
export declare function calculateCharityImpact(state: IPlayer): TransactionImpact;
/**
 * Calculate impact of doodad purchase
 */
export declare function calculateDoodadImpact(state: IPlayer, params: DoodadParams): TransactionImpact;
/**
 * Calculate impact of having a baby
 */
export declare function calculateBabyImpact(state: IPlayer): TransactionImpact;
/**
 * Calculate impact of stock split
 */
export declare function calculateStockSplitImpact(state: IPlayer, params: StockSplitParams): TransactionImpact;
/**
 * Calculate impact of reverse stock split
 */
export declare function calculateReverseStockSplitImpact(state: IPlayer, params: StockSplitParams): TransactionImpact;
/**
 * Calculate impact of lending or collecting money
 */
export declare function calculateLendCollectImpact(state: IPlayer, params: LendCollectParams): TransactionImpact;
//# sourceMappingURL=transactions.d.ts.map