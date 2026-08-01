import { Game } from '../types';
import { GAMES_LIST } from '../data/gamesData';
import { getGamesFromFirestore, syncGameToFirestore } from '../lib/firebase';

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
    // Purge old cache to ensure fresh list
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_STATUS_KEY);
    } catch (e) {}

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

    // 3. Fallback to GAMES_LIST
    const status: CloudStatus = {
      connected: true,
      loading: false,
      lastUpdated: new Date().toISOString(),
      totalGames: GAMES_LIST.length,
      source: 'GAMES_LIST',
    };

    return { games: GAMES_LIST, status };
  }

  // Add a new game to the Cloud
  public async addGameToCloud(newGame: Partial<Game>): Promise<{ success: boolean; game?: Game; error?: string }> {
    try {
      const gameToAdd: Game = {
        id: newGame.id || `game_${Date.now()}`,
        title: newGame.title || 'משחק חדש',
        subtitle: newGame.subtitle || '',
        description: newGame.description || '',
        longDescription: newGame.longDescription || '',
        category: newGame.category || 'טריוויה ודעת',
        difficulty: newGame.difficulty || 'לכל המשפחה',
        ageRating: newGame.ageRating || 'גילאי 6+',
        playCount: newGame.playCount || 0,
        rating: newGame.rating || 5.0,
        ratingCount: newGame.ratingCount || 1,
        author: newGame.author || 'יוצר קניגיים',
        tags: newGame.tags || ['משחק חדש'],
        thumbnailBg: newGame.thumbnailBg || 'from-indigo-600 to-purple-800',
        iconName: newGame.iconName || 'Gamepad2',
        instructions: newGame.instructions || ['שחק ותהנה!'],
        torahSource: newGame.torahSource,
        gameType: newGame.gameType || 'trivia',
        isPopular: false,
        isNew: true,
        externalUrl: newGame.externalUrl,
        files: newGame.files || [],
      };

      await syncGameToFirestore(gameToAdd);
      return { success: true, game: gameToAdd };
    } catch (error: any) {
      return { success: false, error: error?.message || 'שגיאה בהוספת המשחק' };
    }
  }
}

export const cloudGamesService = CloudGamesService.getInstance();
