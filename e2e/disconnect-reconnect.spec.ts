import { test, expect } from '@playwright/test'

/**
 * E2E specs for disconnect / reconnect (Feature 15.8.1–15.8.2). The 410
 * session-expiry path (15.8.3) is already covered by `session-expiry.spec.ts`.
 *
 * Skipped pending CI backend wiring.
 */

test.describe('Disconnect / Reconnect (15.8)', () => {
  test.skip('15.8.1 — closing a player\'s tab surfaces a "Disconnected" indicator on other players\' overview', async ({
    page,
    context,
  }) => {
    const observer = page
    const departing = await context.newPage()
    // ... setup both, start game ...

    // Observer opens Players Overview, departing player is connected
    await observer.getByRole('link', { name: /players/i }).click()
    const departingCard = observer.locator('[data-test=player-card]', {
      hasText: /Bob/i,
    })
    await expect(departingCard.locator('[data-test=connection-dot]')).toHaveAttribute(
      'data-status',
      'connected',
    )

    // Departing player closes the tab → backend `handleDisconnect` fires →
    // `player:disconnected` socket event → observer's slice flips to
    // 'disconnected'.
    await departing.close()

    await expect
      .poll(
        async () =>
          await departingCard
            .locator('[data-test=connection-dot]')
            .getAttribute('data-status'),
        { timeout: 5000 },
      )
      .toBe('disconnected')

    // Optional: a countdown is shown in the badge
    await expect(departingCard).toContainText(/disconnected|remaining/i)
  })

  test.skip('15.8.2 — reconnect within the 15-min window restores the session and clears the indicator', async ({
    page,
    context,
  }) => {
    const observer = page
    const departing = await context.newPage()
    // ... setup, start, then close `departing` to trigger disconnect ...

    // Persist the credentials in the departing context's tab BEFORE close so
    // the ReconnectionHandler can restore on relaunch. (sessionStorage is
    // per-tab — relaunch a new page in the SAME context to inherit nothing,
    // OR open the URL with the room code intact.)

    const reJoiner = await context.newPage()
    // Pre-load creds into sessionStorage as the existing app would
    await reJoiner.goto('/')
    await reJoiner.evaluate(
      ({ roomCode, playerId, playerName, token }) => {
        sessionStorage.setItem('roomCode', roomCode)
        sessionStorage.setItem('playerId', playerId)
        sessionStorage.setItem('playerName', playerName)
        sessionStorage.setItem('socketAuthToken', token)
      },
      {
        roomCode: 'ABCDEF',
        playerId: 'p2',
        playerName: 'Bob',
        token: 'token-from-original-join',
      },
    )

    // Reload — ReconnectionHandler runs on mount, calls /reconnect, gets
    // a fresh rotated token, navigates to the dashboard.
    await reJoiner.reload()
    await expect(reJoiner.getByText(/welcome back|reconnected successfully/i)).toBeVisible({
      timeout: 5000,
    })
    await expect(reJoiner).toHaveURL(/\/dashboard$/)

    // Observer's overview clears the Disconnected indicator via the
    // `player:reconnected` event.
    const observerCard = observer.locator('[data-test=player-card]', {
      hasText: /Bob/i,
    })
    await expect
      .poll(
        async () =>
          await observerCard
            .locator('[data-test=connection-dot]')
            .getAttribute('data-status'),
        { timeout: 5000 },
      )
      .toBe('connected')

    await reJoiner.close()
    await departing.close()
  })
})
