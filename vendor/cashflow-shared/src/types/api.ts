import { IGameSession, IPlayer, ITransaction, IDream } from './models';
import { AssetType, LiabilityType, MarketEventType } from '../enums';

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
    details?: any;
  };
}

// Game Session APIs
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

// Player Setup APIs
export interface PlayerSetupRequest {
  profession: string;
  dream: IDream;
  auditorPlayerId: string;
}

export interface PlayerSetupResponse {
  player: Partial<IPlayer>;
}

// Dashboard APIs
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

// Transaction APIs
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
  amount?: number; // For taking loan
  liabilityId?: string; // For paying off
  payoffAmount?: number; // For paying off
}

export interface MarketEventRequest {
  type: 'market_event';
  subType: MarketEventType;
  details?: {
    amount?: number; // For doodad, lend_collect
    assetId?: string; // For stock splits
  };
}

export interface PaydayRequest {
  // No additional fields needed
}

export type TransactionRequest =
  | BuyAssetRequest
  | SellAssetRequest
  | LoanRequest
  | MarketEventRequest
  | PaydayRequest;

export interface TransactionResponse {
  transaction: ITransaction;
  requiresAudit: boolean;
  updatedPlayer?: Partial<IPlayer>;
}

// Audit APIs
export interface AuditRequest {
  action: 'approve' | 'reject';
  note?: string;
}

export interface AuditResponse {
  transaction: ITransaction;
  updatedPlayer?: IPlayer;
  fastTrackAchieved?: boolean;
}

// Query APIs
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

// Reconnection API
export interface ReconnectRequest {
  playerId: string;
  socketId: string;
}

export interface ReconnectResponse {
  gameSession: IGameSession;
  player: IPlayer;
  otherPlayers: PlayersListResponse['players'];
}