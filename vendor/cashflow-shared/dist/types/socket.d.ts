import { IPlayer } from './models';
export declare enum SocketEvents {
    JOIN_ROOM = "join:room",
    LEAVE_ROOM = "leave:room",
    PLAYER_JOINED = "player:joined",
    PLAYER_UPDATED = "player:updated",
    PLAYER_DISCONNECTED = "player:disconnected",
    PLAYER_RECONNECTED = "player:reconnected",
    PLAYER_REMOVED = "player:removed",
    GAME_STARTED = "game:started",
    TRANSACTION_PENDING = "transaction:pending",
    TRANSACTION_FINALIZED = "transaction:finalized",
    TRANSACTION_REJECTED = "transaction:rejected",
    PAYDAY_COLLECTED = "payday:collected",
    FASTTRACK_ACHIEVED = "fasttrack:achieved",
    SESSION_EXPIRY_WARNING = "session:expiry_warning",
    SESSION_EXPIRED = "session:expired"
}
export interface PlayerJoinedPayload {
    playerId: string;
    playerName: string;
}
export interface PlayerUpdatedPayload {
    playerId: string;
    player: Partial<IPlayer>;
}
export interface PlayerDisconnectedPayload {
    playerId: string;
    playerName: string;
    disconnectedAt: Date;
}
export interface PlayerReconnectedPayload {
    playerId: string;
    playerName: string;
}
export interface PlayerRemovedPayload {
    playerId: string;
    playerName: string;
    reason: 'disconnect_timeout' | 'manual_removal';
}
export interface GameStartedPayload {
    startedAt: Date;
}
export interface TransactionPendingPayload {
    transactionId: string;
    playerId: string;
    playerName: string;
    summary: string;
    type: string;
    subType?: string;
}
export interface TransactionFinalizedPayload {
    transactionId: string;
    playerId: string;
    playerName: string;
    type: string;
    subType?: string;
    description: string;
    approved: boolean;
}
export interface TransactionRejectedPayload {
    transactionId: string;
    note?: string;
}
export interface PaydayCollectedPayload {
    playerId: string;
    playerName: string;
    amount: number;
    newCashOnHand: number;
}
export interface FastTrackAchievedPayload {
    playerId: string;
    playerName: string;
    passiveIncome: number;
    totalExpenses: number;
}
export interface SessionExpiryWarningPayload {
    expiresAt: Date;
    minutesRemaining: number;
}
export interface SessionExpiredPayload {
    reason: 'inactivity';
    expiredAt: Date;
}
export interface ClientToServerEvents {
    [SocketEvents.JOIN_ROOM]: (roomCode: string) => void;
    [SocketEvents.LEAVE_ROOM]: (roomCode: string) => void;
}
export interface ServerToClientEvents {
    [SocketEvents.PLAYER_JOINED]: (payload: PlayerJoinedPayload) => void;
    [SocketEvents.PLAYER_UPDATED]: (payload: PlayerUpdatedPayload) => void;
    [SocketEvents.PLAYER_DISCONNECTED]: (payload: PlayerDisconnectedPayload) => void;
    [SocketEvents.PLAYER_RECONNECTED]: (payload: PlayerReconnectedPayload) => void;
    [SocketEvents.PLAYER_REMOVED]: (payload: PlayerRemovedPayload) => void;
    [SocketEvents.GAME_STARTED]: (payload: GameStartedPayload) => void;
    [SocketEvents.TRANSACTION_PENDING]: (payload: TransactionPendingPayload) => void;
    [SocketEvents.TRANSACTION_FINALIZED]: (payload: TransactionFinalizedPayload) => void;
    [SocketEvents.TRANSACTION_REJECTED]: (payload: TransactionRejectedPayload) => void;
    [SocketEvents.PAYDAY_COLLECTED]: (payload: PaydayCollectedPayload) => void;
    [SocketEvents.FASTTRACK_ACHIEVED]: (payload: FastTrackAchievedPayload) => void;
    [SocketEvents.SESSION_EXPIRY_WARNING]: (payload: SessionExpiryWarningPayload) => void;
    [SocketEvents.SESSION_EXPIRED]: (payload: SessionExpiredPayload) => void;
}
//# sourceMappingURL=socket.d.ts.map