import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * UI-level flow helpers. These drive the app the way a person would,
 * so they double as smoke coverage for the entry flows they traverse.
 */

const ROOM_CODE_RE = /^[A-Z0-9]{6}$/

/** Landing → Create Game → success screen. Returns the room code. */
export async function createGameViaUI(page: Page, hostName: string): Promise<string> {
  await page.goto('/')
  await page.getByRole('button', { name: /create new game/i }).click()
  await page.getByLabel(/your name/i).fill(hostName)
  await page.getByRole('button', { name: /^create game$/i }).click()

  await expect(page.getByText(/game created successfully/i)).toBeVisible()
  const codeText = await page.getByText(ROOM_CODE_RE).first().innerText()
  expect(codeText).toMatch(ROOM_CODE_RE)
  return codeText
}

/**
 * Landing → Join Game → lobby or setup.
 * NOTE: locate by placeholder, not label — AccessibilityProvider overwrites
 * every input's aria-label with its placeholder, which masks the real
 * <label htmlFor> association from the accessibility tree.
 */
export async function joinGameViaUI(page: Page, roomCode: string, playerName: string): Promise<void> {
  await page.goto('/join')
  await page.getByPlaceholder('Enter 6-character code').fill(roomCode)
  await page.getByPlaceholder('Enter your name').fill(playerName)
  await page.getByRole('button', { name: /join game/i }).click()
  await expect(page).toHaveURL(new RegExp(`/game/${roomCode}/setup`), { timeout: 15_000 })
}

export interface SetupUIOptions {
  /** Dream card to pick (must match the card title). */
  dreamName?: string
  /** Auditor to pick by player name; omit to skip auditor selection. */
  auditorName?: string
}

/**
 * Complete the setup wizard from /game/:code/setup.
 * The profession is auto-assigned by the app; we just confirm dream/auditor.
 * Ends on the lobby.
 */
export async function completeSetupViaUI(page: Page, opts: SetupUIOptions = {}): Promise<void> {
  const dream = opts.dreamName ?? 'Buy a Forest'
  await expect(page.getByText(/you have been assigned/i)).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: new RegExp(dream, 'i') }).click()

  if (opts.auditorName) {
    await page
      .getByRole('button', { name: new RegExp(opts.auditorName, 'i') })
      .last()
      .click()
  }

  const confirm = page.getByRole('button', { name: /confirm & continue/i })
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect(page).toHaveURL(/\/lobby$/, { timeout: 15_000 })
}

/** Click Start Game in the lobby and wait for the dashboard. */
export async function startGameViaUI(hostPage: Page): Promise<void> {
  await hostPage.getByRole('button', { name: /^start game$/i }).click()
  await expect(hostPage).toHaveURL(/\/dashboard$/, { timeout: 15_000 })
}

/** A labeled value row in the dashboard's Financial Overview card. */
export function metricValue(page: Page, label: string): Locator {
  return page
    .locator(`div.flex.justify-between:has(> span:text-is("${label}"))`)
    .locator('span')
    .nth(1)
}

/** Parse "$1,234" → 1234 (negative supported). */
export function parseMoney(text: string): number {
  const cleaned = text.replace(/[^0-9.-]/g, '')
  return Number(cleaned)
}

export async function readMetric(page: Page, label: string): Promise<number> {
  const text = await metricValue(page, label).innerText()
  return parseMoney(text)
}

/**
 * Number inputs in the transaction wizards have unassociated <label>s
 * (the label element is a sibling, not linked by htmlFor), so getByLabel
 * cannot find them. Locate the input inside the label's wrapper div.
 */
export function fieldByLabel(page: Page, labelText: string): Locator {
  return page
    .locator(`div:has(> label:text-matches("${labelText}"))`)
    .locator('input, select, textarea')
    .first()
}

/**
 * Drive the Buy Asset wizard for a stock purchase, up to and including
 * "Submit for Audit". Starts from the dashboard.
 */
export async function buyStockViaUI(
  page: Page,
  stock: { symbol: string; price: number; shares: number },
): Promise<void> {
  await page.getByRole('button', { name: /^buy asset$/i }).click()
  await expect(page).toHaveURL(/\/transaction\/buy$/)

  // Asset-type cards are clickable divs (not buttons)
  await page.getByText('Stocks', { exact: true }).click()
  await page.getByRole('button', { name: /^next$/i }).click()

  await fieldByLabel(page, 'Select Stock').selectOption(stock.symbol)
  await fieldByLabel(page, 'Price per Share').fill(String(stock.price))
  await fieldByLabel(page, 'Number of Shares').fill(String(stock.shares))

  await page.getByRole('button', { name: /preview impact/i }).click()
  await expect(page.getByRole('heading', { name: 'Financial Impact' })).toBeVisible()
  await page.getByRole('button', { name: /submit for audit/i }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 })
}
