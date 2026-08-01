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
  // 1. Try Firestore DB
  try {
    const gamesList = await getGamesFromFirestore();
    if (gamesList && Array.isArray(gamesList) && gamesList.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(gamesList));
      const status: CloudStatus = {
        connected: true,
        loading: false,
        lastUpdated: new Date().toISOString(),
        totalGames: gamesList.length,
        source: 'Firestore Database', 
      };
      localStorage.setItem(CACHE_STATUS_KEY, JSON.stringify(status));
      return { games: gamesList, status };
    }
  } catch (err: any) {
    console.warn('Firestore games fetch warning:', err);
  }

  // 2. Try JSON database endpoint (/games.json or /api/games) for deployed static/server host
  try {
    let jsonRes = await fetch('/games.json');
    if (!jsonRes.ok) {
      jsonRes = await fetch('/api/games');
    }
    if (jsonRes.ok) {
      const data = await jsonRes.json();
      let gamesArray: Game[] = Array.isArray(data) ? data : (data.games || []);
      if (Array.isArray(gamesArray) && gamesArray.length > 0) {
        gamesArray = gamesArray.map((g) => {
          if (g.id === 'memory-jewish-game') return { ...g, gameType: 'native_memory', externalUrl: undefined };
          if (g.id === 'tanach-wordle-game') return { ...g, gameType: 'native_wordle', externalUrl: undefined };
          return g;
        });
        localStorage.setItem(CACHE_KEY, JSON.stringify(gamesArray));
        const status: CloudStatus = {
          connected: true,
          loading: false,
          lastUpdated: new Date().toISOString(),
          totalGames: gamesArray.length,
          source: 'Qnigame JSON Database', 
        };
        localStorage.setItem(CACHE_STATUS_KEY, JSON.stringify(status));
        return { games: gamesArray, status };
      }
    }
  } catch (err: any) {
    console.warn('JSON database fetch warning:', err);
  }

  // 3. Fallback to localStorage cache or GAMES_LIST
  const cached = localStorage.getItem(CACHE_KEY);
  let fallbackGames = GAMES_LIST;

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        fallbackGames = parsed.map((g: Game) => {
          if (g.id === 'memory-jewish-game') return { ...g, gameType: 'native_memory', externalUrl: undefined };
          if (g.id === 'tanach-wordle-game') return { ...g, gameType: 'native_wordle', externalUrl: undefined };
          return g;
        });
      }
    } catch (e) {
      console.error('Error parsing cached games', e);
    }
  }

  const status: CloudStatus = {
    connected: true,
    loading: false,
    lastUpdated: new Date().toISOString(),
    totalGames: fallbackGames.length,
    source: 'ספריה מקומית (מטמון)',
  };

  return { games: fallbackGames, status };
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
