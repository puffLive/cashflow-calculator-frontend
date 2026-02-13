export const ROUTES = {
  LANDING: '/',
  GAME_LOBBY: '/game/:roomCode/lobby',
  GAME_SETUP: '/game/:roomCode/setup',
  GAME_DASHBOARD: '/game/:roomCode/dashboard',
  GAME_PLAYERS: '/game/:roomCode/players',
  GAME_INCOME: '/game/:roomCode/income',
  GAME_EXPENSES: '/game/:roomCode/expenses',
  GAME_ASSETS: '/game/:roomCode/assets',
  GAME_LIABILITIES: '/game/:roomCode/liabilities',
  GAME_HISTORY: '/game/:roomCode/history',
  GAME_TRANSACTION: '/game/:roomCode/transaction/:type',
} as const

export const buildRoute = (route: string, params: Record<string, string>) => {
  let path = route
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value)
  })
  return path
}