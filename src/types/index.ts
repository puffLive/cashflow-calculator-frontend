// This file will be extended with local type definitions
// Most types should come from the shared backend package

export interface Player {
  id: string
  name: string
  roomCode: string
  profession?: string
  dream?: string
  auditorPlayerId?: string
  isHost: boolean
  isReady: boolean
  connectionStatus: 'connected' | 'disconnected' | 'removed'
  financialData?: PlayerFinancialData
}

export interface PlayerFinancialData {
  cashOnHand: number
  salary: number
  totalIncome: number
  totalExpenses: number
  passiveIncome: number
  paydayAmount: number
  cashflow: number
  isOnFastTrack: boolean
  numberOfChildren: number
  income: IncomeItem[]
  expenses: ExpenseItem[]
  assets: Asset[]
  liabilities: Liability[]
}

export interface IncomeItem {
  id: string
  name: string
  amount: number
  type: 'salary' | 'dividend' | 'interest' | 'rental' | 'business'
}

export interface ExpenseItem {
  id: string
  name: string
  amount: number
  type: string
}

export interface Asset {
  id: string
  name: string
  type: 'stock' | 'mutual_fund' | 'cd' | 'real_estate' | 'gold' | 'business'
  quantity: number
  costBasis: number
  monthlyIncome?: number
}

export interface Liability {
  id: string
  name: string
  type: string
  originalAmount: number
  currentBalance: number
  monthlyPayment: number
}

export interface GameSession {
  roomCode: string
  status: 'waiting' | 'active' | 'completed' | 'expired'
  hostPlayerId: string
  playerCount: number
  maxPlayers: number
  players: Player[]
  createdAt: string
  expiresAt: string
}