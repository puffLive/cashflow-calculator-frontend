// Re-export everything from the shared package
export * from '@cashflow/shared'

// Additional frontend-specific types that extend the shared types
// These are UI-specific types not needed by the backend

import type { IPlayer, IAsset as SharedAsset } from '@cashflow/shared'

// Map shared types to frontend expectations
// Frontend uses 'id' instead of '_id' and different field names

export interface Asset {
  id: string
  name: string
  type: SharedAsset['type']
  quantity: number
  costBasis: number // maps to totalCost in shared
  monthlyIncome?: number // maps to monthlyPassiveIncome in shared
}

export interface Liability {
  id: string
  name: string
  type: string
  originalAmount: number
  currentBalance: number
  monthlyPayment: number
}

// Frontend-specific financial data interface that matches what Redux expects
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

// Income and Expense item types for frontend
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

// Extended Player type for frontend with UI state
export interface Player extends Omit<IPlayer, '_id' | 'income' | 'expenses' | 'assets' | 'liabilities'> {
  id: string // Map _id to id for frontend
  isReady: boolean // UI state for lobby
  financialData?: PlayerFinancialData // Grouped financial data for UI
}

// Extended GameSession for frontend - don't extend since status types differ
export interface GameSession {
  roomCode: string
  status: 'waiting' | 'active' | 'completed' | 'expired' // Frontend status values
  hostPlayerId: string
  playerCount: number // Computed from players array
  maxPlayers: number // Always 6 for now
  players: Player[] // Our extended Player type
  createdAt: string
  expiresAt: string
}

// Re-export shared Asset type with original name for components that need it
export type { IAsset, ILiability } from '@cashflow/shared'