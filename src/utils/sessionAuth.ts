/**
 * Helpers for the per-tab credentials issued by the backend's REST API
 * (createGame / joinGame / reconnect). The Socket.io connection middleware
 * requires `playerId` + `socketAuthToken` on every connect; we persist them
 * in sessionStorage so the socket service can read them from a single place
 * regardless of which screen issued them.
 *
 * Tokens rotate on every successful reconnect, so always overwrite — never
 * skip — when a fresh value is available.
 */

const KEYS = {
  roomCode: 'roomCode',
  playerId: 'playerId',
  playerName: 'playerName',
  socketAuthToken: 'socketAuthToken',
} as const;

export interface SessionCredentials {
  roomCode: string;
  playerId: string;
  playerName: string;
  socketAuthToken: string;
}

/** Persist credentials emitted by createGame / joinGame. */
export function setSessionCredentials(creds: SessionCredentials): void {
  sessionStorage.setItem(KEYS.roomCode, creds.roomCode);
  sessionStorage.setItem(KEYS.playerId, creds.playerId);
  sessionStorage.setItem(KEYS.playerName, creds.playerName);
  sessionStorage.setItem(KEYS.socketAuthToken, creds.socketAuthToken);
}

/** Overwrite just the token — used on reconnect rotation. */
export function setSocketAuthToken(token: string): void {
  sessionStorage.setItem(KEYS.socketAuthToken, token);
}

/** Read whatever the socket service needs to connect. */
export function getSocketAuth(): { playerId: string | null; socketAuthToken: string | null } {
  return {
    playerId: sessionStorage.getItem(KEYS.playerId),
    socketAuthToken: sessionStorage.getItem(KEYS.socketAuthToken),
  };
}

/** Clear everything — used on session expiry / "return to home". */
export function clearSessionCredentials(): void {
  sessionStorage.removeItem(KEYS.roomCode);
  sessionStorage.removeItem(KEYS.playerId);
  sessionStorage.removeItem(KEYS.playerName);
  sessionStorage.removeItem(KEYS.socketAuthToken);
}
