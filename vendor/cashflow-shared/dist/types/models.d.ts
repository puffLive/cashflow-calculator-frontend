import { GameStatus, ConnectionStatus, TransactionType, AuditStatus, AssetType, LiabilityType } from '../enums';
type ObjectId = string;
export interface IDream {
    name: string;
    description: string;
    cost: number;
}
export interface IStock {
    ticker: string;
    fullName: string;
    yieldOrROI: number;
}
export interface IPassiveIncomeItem {
    type: string;
    name: string;
    amount: number;
}
export interface IIncome {
    salary: number;
    passiveIncome: IPassiveIncomeItem[];
}
export interface IExpense {
    taxes: number;
    mortgage: number;
    schoolLoan: number;
    carLoan: number;
    creditCard: number;
    retailPayment: number;
    otherExpenses: number;
    childExpensePerChild: number;
    bankLoanPayment: number;
}
export interface IAsset {
    _id?: ObjectId;
    type: AssetType;
    name: string;
    costPerUnit: number;
    quantity: number;
    totalCost: number;
    monthlyPassiveIncome: number;
    associatedLiabilityId?: ObjectId;
    purchasedAt: Date;
}
export interface ILiability {
    _id?: ObjectId;
    type: LiabilityType;
    name: string;
    originalAmount: number;
    currentBalance: number;
    monthlyPayment: number;
    associatedAssetId?: ObjectId;
}
export interface IPlayer {
    _id: ObjectId;
    gameSessionId: ObjectId;
    playerName: string;
    profession: string;
    auditorPlayerId?: ObjectId;
    dream: IDream;
    cashOnHand: number;
    salary: number;
    numberOfChildren: number;
    isOnFastTrack: boolean;
    connectionStatus: ConnectionStatus;
    disconnectedAt?: Date | null;
    socketId?: string | null;
    income: IIncome;
    expenses: IExpense;
    assets: IAsset[];
    liabilities: ILiability[];
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IGameSession {
    _id: ObjectId;
    roomCode: string;
    gameVersion: 'cashflow_101';
    status: GameStatus;
    maxPlayers: number;
    hostPlayerId: ObjectId;
    players: ObjectId[];
    currentPlayerTurn: ObjectId | null;
    marketCards: any[];
    availableProfessions: string[];
    usedProfessions: string[];
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export interface IAmountChange {
    before: number;
    after: number;
}
export interface ITransaction {
    _id: ObjectId;
    gameSessionId: ObjectId;
    playerId: ObjectId;
    type: TransactionType;
    subType?: string;
    description: string;
    amountsChanged: Record<string, IAmountChange>;
    auditStatus: AuditStatus;
    auditorPlayerId?: ObjectId;
    auditorNote?: string;
    isReversal: boolean;
    reversesTransactionId?: ObjectId;
    createdAt: Date;
    auditedAt?: Date;
}
export interface IProfessionData {
    name: string;
    salary: number;
    savings: number;
    taxes: number;
    mortgage: number;
    schoolLoan: number;
    carLoan: number;
    creditCard: number;
    retailPayment: number;
    otherExpenses: number;
    childExpensePerChild: number;
    liabilities: Array<{
        type: LiabilityType;
        name: string;
        originalAmount: number;
        monthlyPayment: number;
    }>;
}
export {};
//# sourceMappingURL=models.d.ts.map