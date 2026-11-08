import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Playwright E2E Test Configuration
 *
 * Runs the FULL stack locally:
 *  - Backend API + Socket.IO on :3100 backed by an in-memory MongoDB
 *    (cash-flow-backend/scripts/e2e-server.ts, no Docker/Atlas needed)
 *  - Frontend Vite dev server on :5173, pointed at the local backend via
 *    VITE_* env vars (these take priority over the values in .env, which
 *    point at the production Railway deployment — tests must never hit it).
 *
 * Every test creates its own game room, so tests are isolated and can run
 * fully in parallel against the single shared backend.
 */

export const BACKEND_URL = 'http://localhost:3100'

// The backend repo checked out next to this one. Set CASHFLOW_BACKEND_DIR
// to point elsewhere; otherwise either folder name works.
const BACKEND_DIR =
  process.env.CASHFLOW_BACKEND_DIR ??
  (['../cash-flow-backend', '../cashflow-backend'].find((dir) =>
    fs.existsSync(path.resolve(import.meta.dirname, dir, 'package.json'))
  ) ||
    '../cash-flow-backend')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : [['html', { open: 'never' }], ['list']],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Mobile smoke pass: only tests tagged @mobile (the app is mobile-first,
      // so the core entry flows get a second run at phone viewport).
      name: 'Mobile Chrome',
      grep: /@mobile/,
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      command: 'npm run e2e:server',
      cwd: BACKEND_DIR,
      url: `${BACKEND_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000, // first run may download the mongodb-memory-server binary
      env: {
        E2E_PORT: '3100',
        LOG_LEVEL: 'warn',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_API_BASE_URL: `${BACKEND_URL}/api`,
        VITE_SOCKET_URL: BACKEND_URL,
      },
    },
  ],
})
