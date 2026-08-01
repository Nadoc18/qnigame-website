import { Game } from '../types';
import { GAMES_LIST } from '../data/gamesData';
import { getGamesFromFirestore } from '../lib/firebase';

export interface CloudStatus {
  connected: boolean;
  loading: boolean;
  lastUpdated: string | null;
  totalGames: number;
  source: string;
  error?: string;
}

const CACHE_KEY = 'qnigame_cloud_games_cache';
const CACHE_STATUS_KEY = 'qnigame_cloud_status';

const sanitizeGame = (game: Game): Game => {
  if (game.id === 'memory-jewish-game') {
    return {
      ...game,
      gameType: 'native_memory',
      externalUrl: undefined,
      playUrl: undefined,
    };
  }
  if (game.id === 'tanach-wordle-game') {
    return {
      ...game,
      gameType: 'native_wordle',
      externalUrl: undefined,
      playUrl: undefined,
    };
  }
  // Remove erroneous TimeCount externalUrl from all games except 'time-count'
  if (game.id !== 'time-count' && game.externalUrl?.includes('nadoc-games.com/TimeCount')) {
    return {
      ...game,
      externalUrl: undefined,
    };
  }
  return game;
};

const ensureNativeGamesPresent = (games: Game[]): Game[] => {
  const sanitized = games.map(sanitizeGame);
  const nativeIds = ['tanach-wordle-game', 'memory-jewish-game'];
  for (const nativeId of nativeIds) {
    if (!sanitized.some((g) => g.id === nativeId)) {
      const nativeGame = GAMES_LIST.find((g) => g.id === nativeId);
      if (nativeGame) {
        sanitized.unshift(nativeGame);
      }
    }
  }
  return sanitized;
};

export class CloudGamesService {
  private static instance: CloudGamesService;

  private constructor() {}

  public static getInstance(): CloudGamesService {
    if (!CloudGamesService.instance) {
      CloudGamesService.instance = new CloudGamesService();
    }
    return CloudGamesService.instance;
  }

  public async fetchGamesFromCloud(): Promise<{ games: Game[]; status: CloudStatus }> {
    // Unconditionally purge old games cache on fetch to ensure fresh games list
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_STATUS_KEY);
    } catch (e) {}

    // 1. Try Firestore DB
    try {
      const gamesList = await getGamesFromFirestore();
      if (gamesList && Array.isArray(gamesList) && gamesList.length > 0) {
        const sanitized = ensureNativeGamesPresent(gamesList);
        localStorage.setItem(CACHE_KEY, JSON.stringify(sanitized));
        const status: CloudStatus = {
          connected: true,
          loading: false,
          lastUpdated: new Date().toISOString(),
          totalGames: sanitized.length,
          source: 'v2_clean_Firestore', 
        };
        localStorage.setItem(CACHE_STATUS_KEY, JSON.stringify(status));
        return { games: sanitized, status };
      }
    } catch (err: any) {
      console.warn('Firestore games fetch warning:', err);
    }

    // 2. Try JSON database endpoint (/games.json or /api/games)
    try {
      let jsonRes = await fetch('/games.json');
      if (!jsonRes.ok) {
        jsonRes = await fetch('/api/games');
      }
      if (jsonRes.ok) {
        const data = await jsonRes.json();
        const gamesArray: Game[] = Array.isArray(data) ? data : (data.games || []);
        if (Array.isArray(gamesArray) && gamesArray.length > 0) {
          const sanitized = ensureNativeGamesPresent(gamesArray);
          localStorage.setItem(CACHE_KEY, JSON.stringify(sanitized));
          const status: CloudStatus = {
            connected: true,
            loading: false,
            lastUpdated: new Date().toISOString(),
            totalGames: sanitized.length,
            source: 'v2_clean_JSON', 
          };
          localStorage.setItem(CACHE_STATUS_KEY, JSON.stringify(status));
          return { games: sanitized, status };
        }
      }
    } catch (err: any) {
      console.warn('JSON database fetch warning:', err);
    }

    // 3. Fallback to GAMES_LIST
    const sanitized = ensureNativeGamesPresent(GAMES_LIST);
    const status: CloudStatus = {
      connected: true,
      loading: false,
      lastUpdated: new Date().toISOString(),
      totalGames: sanitized.length,
      source: 'v2_clean_GAMES_LIST',
    };

    return { games: sanitized, status };
  }

  // Add a new game to the Cloud
  public async addGameToCloud(newGame: Partial<Game>): Promise<{ success: boolean; game?: Game; error?: string }> {
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
      });

      const data = await res.json();
      if (data.success && data.game) {
        return { success: true, game: data.game };
      } else {
        return { success: false, error: data.error || 'שגיאה בהוספת המשחק' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'שגיאת תקשורת עם השרת' };
    }
  }

  // Sync from custom cloud JSON URL
  public async syncWithCloudUrl(cloudUrl: string): Promise<{ success: boolean; totalGames?: number; error?: string }> {
    try {
      const res = await fetch('/api/games/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloudUrl })
      });

      const data = await res.json();
      if (data.success) {
        return { success: true, totalGames: data.totalGames };
      } else {
        return { success: false, error: data.error || 'סנכרון הענן נכשל' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'שגיאת תקשורת במענה הענן' };
    }
  }
}

export const cloudGamesService = CloudGamesService.getInstance();
