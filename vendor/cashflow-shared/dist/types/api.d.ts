import { IGameSession, IPlayer, ITransaction, IDream } from './models';
import { AssetType, MarketEventType } from '../enums';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        statusCode: number;
        details?: any;
    };
}
export interface CreateGameRequest {
    gameVersion: 'cashflow_101';
    hostPlayerName: string;
}
export interface CreateGameResponse {
    roomCode: string;
    gameSessionId: string;
    playerId: string;
}
export interface JoinGameRequest {
    playerName: string;
}
export interface JoinGameResponse {
    gameSessionId: string;
    playerId: string;
    players: Array<{
        id: string;
        name: string;
        profession?: string;
        connectionStatus: string;
    }>;
}
export interface StartGameRequest {
    playerId: string;
}
export interface PlayerSetupRequest {
    profession: string;
    dream: IDream;
    auditorPlayerId: string;
}
export interface PlayerSetupResponse {
    player: Partial<IPlayer>;
}
export interface PlayerDashboardResponse {
    player: IPlayer;
    computed: {
        totalIncome: number;
        totalExpenses: number;
        paydayAmount: number;
        cashflow: number;
        passiveIncome: number;
        isOnFastTrack: boolean;
    };
}
export interface BuyAssetRequest {
    type: 'buy';
    subType: AssetType;
    details: {
        name: string;
        pricePerShare?: number;
        numShares?: number;
        dividendPerShare?: number;
        cdValue?: number;
        interestRate?: number;
        cost?: number;
        downPayment?: number;
        mortgageAmount?: number;
        monthlyCashflow?: number;
        costPerUnit?: number;
        quantity?: number;
    };
}
export interface SellAssetRequest {
    type: 'sell';
    assetId: string;
    salePrice: number;
    quantity?: number;
}
export interface LoanRequest {
    type: 'loan_take' | 'loan_payoff';
    amount?: number;
    liabilityId?: string;
    payoffAmount?: number;
}
export interface MarketEventRequest {
    type: 'market_event';
    subType: MarketEventType;
    details?: {
        amount?: number;
        assetId?: string;
    };
}
export interface PaydayRequest {
}
export type TransactionRequest = BuyAssetRequest | SellAssetRequest | LoanRequest | MarketEventRequest | PaydayRequest;
export interface TransactionResponse {
    transaction: ITransaction;
    requiresAudit: boolean;
    updatedPlayer?: Partial<IPlayer>;
}
export interface AuditRequest {
    action: 'approve' | 'reject';
    note?: string;
}
export interface AuditResponse {
    transaction: ITransaction;
    updatedPlayer?: IPlayer;
    fastTrackAchieved?: boolean;
}
export interface TransactionQueryParams {
    playerId?: string;
    type?: string;
    auditStatus?: string;
    auditorId?: string;
    limit?: number;
    offset?: number;
}
export interface PlayersListResponse {
    players: Array<{
        id: string;
        playerName: string;
        profession: string;
        cashOnHand: number;
        cashflow: number;
        totalIncome: number;
        totalExpenses: number;
        paydayAmount: number;
        passiveIncome: number;
        assetCount: number;
        isOnFastTrack: boolean;
        connectionStatus: string;
    }>;
}
export interface ReconnectRequest {
    playerId: string;
    socketId: string;
}
export interface ReconnectResponse {
    gameSession: IGameSession;
    player: IPlayer;
    otherPlayers: PlayersListResponse['players'];
}
//# sourceMappingURL=api.d.ts.map