/**
 * Game Session Token Manager for Qnigame
 * Generates and validates temporary tokens for external PixiJS and HTML5 games.
 */

export interface GameSessionToken {
  token: string;
  userId: string;
  gameId: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory token storage for active sessions
const activeTokensMap = new Map<string, GameSessionToken>();

/**
 * Generate a new temporary session token for a user and game.
 * Token expires in 2 hours by default.
 */
export function generateGameSessionToken(userId: string, gameId: string, ttlMs: number = 2 * 60 * 60 * 1000): string {
  const randomStr = Math.random().toString(36).substring(2, 10);
  const token = `qnigame_tok_${userId}_${gameId}_${Date.now()}_${randomStr}`;

  const sessionToken: GameSessionToken = {
    token,
    userId,
    gameId,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };

  activeTokensMap.set(token, sessionToken);
  
  // Also store in sessionStorage for browser reloads
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`qnigame_token_${gameId}`, JSON.stringify(sessionToken));
    } catch (e) {
      console.warn('SessionStorage error:', e);
    }
  }

  return token;
}

/**
 * Validate a game session token.
 * Returns the token payload if valid, or null if invalid/expired.
 */
export function verifyGameSessionToken(token: string): GameSessionToken | null {
  if (!token) return null;

  let sessionToken = activeTokensMap.get(token);

  // Fallback to checking sessionStorage if in-memory map lost token on hot reload
  if (!sessionToken && typeof window !== 'undefined') {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('qnigame_token_')) {
          const raw = sessionStorage.getItem(key);
          if (raw) {
            const parsed: GameSessionToken = JSON.parse(raw);
            if (parsed.token === token) {
              sessionToken = parsed;
              activeTokensMap.set(token, parsed);
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('SessionStorage read error:', e);
    }
  }

  if (!sessionToken) return null;

  if (Date.now() > sessionToken.expiresAt) {
    activeTokensMap.delete(token);
    return null;
  }

  return sessionToken;
}

/**
 * Revoke a token
 */
export function revokeGameSessionToken(token: string): void {
  activeTokensMap.delete(token);
}
