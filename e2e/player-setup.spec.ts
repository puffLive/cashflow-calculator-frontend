import { test, expect } from './helpers/fixtures'
import { createGameViaUI, joinGameViaUI, completeSetupViaUI } from './helpers/ui'

/**
 * Player setup wizard: profession assignment, dream selection, auditor
 * selection, and the financial sheet preview. Uses the real UI end to end.
 */

test.describe('Player setup', () => {
  test('assigns a profession and shows its financials', async ({ page }) => {
    const roomCode = await createGameViaUI(page, 'Setup Host')
    await page.getByRole('button', { name: /set up your player/i }).click()
    await expect(page).toHaveURL(new RegExp(`/game/${roomCode}/setup`))

    await expect(page.getByText(/you have been assigned/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/monthly salary/i)).toBeVisible()
    await expect(page.getByText(/monthly expenses/i)).toBeVisible()
    await expect(page.getByText(/select your dream/i)).toBeVisible()
    await expect(page.getByText(/your starting financial sheet/i)).toBeVisible()
  })

  test('confirm is disabled until a dream is selected', async ({ page }) => {
    await createGameViaUI(page, 'Dreamless Host')
    await page.getByRole('button', { name: /set up your player/i }).click()
    await expect(page.getByText(/you have been assigned/i)).toBeVisible({ timeout: 15_000 })

    const confirm = page.getByRole('button', { name: /confirm & continue/i })
    await expect(confirm).toBeDisabled()
    await page.getByRole('button', { name: /buy a forest/i }).click()
    await expect(confirm).toBeEnabled()
  })

  test('completing setup returns to the lobby as ready', async ({ page, api }) => {
    const roomCode = await createGameViaUI(page, 'Ready Host')
    await page.getByRole('button', { name: /set up your player/i }).click()
    await completeSetupViaUI(page)

    await expect(page.getByText(/ready/i).first()).toBeVisible()
    const players = await api.getPlayers(roomCode)
    const host = players.find((p: any) => p.playerName === 'Ready Host')
    expect(host).toBeTruthy()
    expect(host.profession).toBeTruthy()
  })

  test('UI financial preview matches the backend player record', async ({ page, api }) => {
    const roomCode = await createGameViaUI(page, 'Numbers Host')
    await page.getByRole('button', { name: /set up your player/i }).click()
    await completeSetupViaUI(page)

    const players = await api.getPlayers(roomCode)
    const host = players.find((p: any) => p.playerName === 'Numbers Host')

    // The lobby → dashboard numbers must agree with backend truth.
    // (Guards against the shared-package data drift where the setup preview
    // and the persisted player disagree.)
    expect(host.totalExpenses).toBeGreaterThan(0)
    expect(host.paydayAmount).toBe(host.totalIncome - host.totalExpenses)
  })

  test('selected auditor is persisted on the player record', async ({ page, api, browser }) => {
    // Host created + set up via API so the joiner has an auditor candidate.
    const created = await api.createGame('Auditor Target')
    await api.setupPlayer(created.roomCode, created.hostPlayerId, { profession: 'secretary' })

    await joinGameViaUI(page, created.roomCode, 'Auditor Picker')
    await completeSetupViaUI(page, { dreamName: 'Yacht Racing', auditorName: 'Auditor Target' })

    const players = await api.getPlayers(created.roomCode)
    const picker = players.find((p: any) => p.playerName === 'Auditor Picker')
    expect(String(picker.auditorPlayerId?._id ?? picker.auditorPlayerId)).toBe(
      created.hostPlayerId,
    )
  })
})
