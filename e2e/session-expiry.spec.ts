import { test, expect } from '@playwright/test'

/**
 * E2E test for backend bug 16.5.3 / frontend wiring 16.6.4.
 *
 * The backend now returns `410 Gone { error: "Game expired", message }` on any
 * write call against an expired session. The apiSlice baseQuery wrapper is
 * supposed to catch every 410, clear per-tab credentials, and dispatch
 * `openModal('session_expired')` to surface the existing SessionExpiredModal.
 *
 * Unlike most e2e specs, this one runs WITHOUT a live backend — we intercept
 * the relevant API call via Playwright's `page.route()` and inject a 410
 * response, then assert the frontend reacts. That isolates the front-end
 * contract from any backend test infrastructure.
 *
 * NOTE: this test exercises the modal-display path. The actual create-game
 * endpoint never returns 410 in production (no session exists yet at that
 * point) — but the apiSlice wrapper doesn't know which endpoint was called,
 * just that some write returned 410. That's exactly the contract we want
 * to pin: regardless of which endpoint emits 410, the modal fires.
 */
test.describe('410 Session expiry — modal opens, credentials cleared', () => {
  test('returns user to a SessionExpiredModal when any write call returns 410', async ({ page }) => {
    // Pre-populate sessionStorage as if the user already had a session — so
    // we can verify `clearSessionCredentials()` runs.
    await page.goto('/')
    await page.evaluate(() => {
      sessionStorage.setItem('roomCode', 'ABCDEF')
      sessionStorage.setItem('playerId', 'pre-existing-id')
      sessionStorage.setItem('playerName', 'Test Player')
      sessionStorage.setItem('socketAuthToken', 'pre-existing-token')
    })

    // Intercept the next POST /api/games and respond 410.
    await page.route('**/api/games', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 410,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Game expired',
            message: 'This game session has expired',
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Trigger a write that the apiSlice baseQuery routes through. Going
    // through /create exercises the createGame mutation, which the wrapper
    // intercepts uniformly with everything else.
    await page.goto('/create')
    await page.getByLabel(/your name/i).fill('Test Player')
    await page.getByRole('button', { name: /create game/i }).click()

    // The SessionExpiredModal should fade in. The component renders a heading
    // "Session Expired" — match on it.
    await expect(page.getByRole('heading', { name: /session expired/i })).toBeVisible({
      timeout: 5000,
    })

    // Per-tab credentials should be wiped. Verify by reading sessionStorage.
    const stored = await page.evaluate(() => ({
      roomCode: sessionStorage.getItem('roomCode'),
      playerId: sessionStorage.getItem('playerId'),
      socketAuthToken: sessionStorage.getItem('socketAuthToken'),
    }))
    expect(stored.roomCode).toBeNull()
    expect(stored.playerId).toBeNull()
    expect(stored.socketAuthToken).toBeNull()

    // The "Return to Home" button navigates back to "/".
    await page.getByRole('button', { name: /return to home/i }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
