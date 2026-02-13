import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { PlayerFinancialData, IncomeItem, ExpenseItem, Asset, Liability } from '@/types'

interface PlayerState extends PlayerFinancialData {
  id: string | null
  name: string | null
  profession: string | null
  dream: string | null
  auditorPlayerId: string | null
  isReady: boolean
}

const initialState: PlayerState = {
  id: null,
  name: null,
  profession: null,
  dream: null,
  auditorPlayerId: null,
  isReady: false,
  cashOnHand: 0,
  salary: 0,
  totalIncome: 0,
  totalExpenses: 0,
  passiveIncome: 0,
  paydayAmount: 0,
  cashflow: 0,
  isOnFastTrack: false,
  numberOfChildren: 0,
  income: [],
  expenses: [],
  assets: [],
  liabilities: [],
}

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlayerData: (state, action: PayloadAction<Partial<PlayerState>>) => {
      return { ...state, ...action.payload }
    },
    updateFinancials: (state, action: PayloadAction<Partial<PlayerFinancialData>>) => {
      Object.assign(state, action.payload)
      // Recalculate derived values
      state.totalIncome = state.salary + state.passiveIncome
      state.cashflow = state.passiveIncome - state.totalExpenses
      state.paydayAmount = state.totalIncome - state.totalExpenses
      state.isOnFastTrack = state.passiveIncome >= state.totalExpenses
    },
    addIncome: (state, action: PayloadAction<IncomeItem>) => {
      state.income.push(action.payload)
      state.passiveIncome = state.income.reduce((sum, item) =>
        item.type !== 'salary' ? sum + item.amount : sum, 0)
    },
    removeIncome: (state, action: PayloadAction<string>) => {
      state.income = state.income.filter(item => item.id !== action.payload)
      state.passiveIncome = state.income.reduce((sum, item) =>
        item.type !== 'salary' ? sum + item.amount : sum, 0)
    },
    addExpense: (state, action: PayloadAction<ExpenseItem>) => {
      state.expenses.push(action.payload)
      state.totalExpenses = state.expenses.reduce((sum, item) => sum + item.amount, 0)
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter(item => item.id !== action.payload)
      state.totalExpenses = state.expenses.reduce((sum, item) => sum + item.amount, 0)
    },
    addAsset: (state, action: PayloadAction<Asset>) => {
      state.assets.push(action.payload)
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      state.assets = state.assets.filter(asset => asset.id !== action.payload)
    },
    addLiability: (state, action: PayloadAction<Liability>) => {
      state.liabilities.push(action.payload)
    },
    removeLiability: (state, action: PayloadAction<string>) => {
      state.liabilities = state.liabilities.filter(liability => liability.id !== action.payload)
    },
    updateCashOnHand: (state, action: PayloadAction<number>) => {
      state.cashOnHand = action.payload
    },
    collectPayday: (state) => {
      state.cashOnHand += state.paydayAmount
    },
    setFastTrack: (state, action: PayloadAction<boolean>) => {
      state.isOnFastTrack = action.payload
    },
    resetPlayer: () => initialState,
  },
})

export const {
  setPlayerData,
  updateFinancials,
  addIncome,
  removeIncome,
  addExpense,
  removeExpense,
  addAsset,
  removeAsset,
  addLiability,
  removeLiability,
  updateCashOnHand,
  collectPayday,
  setFastTrack,
  resetPlayer,
} = playerSlice.actions

// Selectors
export const selectCurrentPlayer = (state: RootState) => state.player
export const selectPaydayAmount = (state: RootState) => state.player.paydayAmount
export const selectCashflow = (state: RootState) => state.player.cashflow
export const selectIsOnFastTrack = (state: RootState) => state.player.isOnFastTrack
export const selectCashOnHand = (state: RootState) => state.player.cashOnHand
export const selectTotalIncome = (state: RootState) => state.player.totalIncome
export const selectTotalExpenses = (state: RootState) => state.player.totalExpenses
export const selectPassiveIncome = (state: RootState) => state.player.passiveIncome

export default playerSlice.reducer