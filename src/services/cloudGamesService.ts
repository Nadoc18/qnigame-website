import { Game, getGameThumbnailUrl } from '../types';
import { GAMES_LIST } from '../data/gamesData';
import { getGamesFromFirestore, enrichGamesWithLiveRatings } from '../lib/firebase';

const normalizeGame = (game: any): Game => {
  const thumb = getGameThumbnailUrl(game);
  return {
    ...game,
    thumbnailUrl: thumb || game.thumbnailUrl,
    imageUrl: thumb || game.imageUrl,
  };
};

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

  public async fetchGamesFromCloud(isAdmin: boolean = false): Promise<{ games: Game[]; status: CloudStatus }> {
    // Purge old cache to ensure fresh list from Firebase
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_STATUS_KEY);
    } catch (e) {}

    // 1. Try Firebase Firestore DB
    try {
      const rawGamesList = await getGamesFromFirestore(isAdmin);
      if (rawGamesList && Array.isArray(rawGamesList) && rawGamesList.length > 0) {
        let gamesList = rawGamesList.map(normalizeGame);
        gamesList = await enrichGamesWithLiveRatings(gamesList);
        localStorage.setItem(CACHE_KEY, JSON.stringify(gamesList));
        const status: CloudStatus = {
          connected: true,
          loading: false,
          lastUpdated: new Date().toISOString(),
          totalGames: gamesList.length,
          source: 'Firebase Firestore', 
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
        const rawGamesArray: any[] = Array.isArray(data) ? data : (data.games || []);
        if (Array.isArray(rawGamesArray) && rawGamesArray.length > 0) {
          let gamesArray: Game[] = rawGamesArray.filter(g => isAdmin || !g.isAdminOnly).map(normalizeGame);
          gamesArray = await enrichGamesWithLiveRatings(gamesArray);
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
    let fallbackList = GAMES_LIST.filter(g => isAdmin || !g.isAdminOnly).map(normalizeGame);
    fallbackList = await enrichGamesWithLiveRatings(fallbackList);
    const status: CloudStatus = {
      connected: true,
      loading: false,
      lastUpdated: new Date().toISOString(),
      totalGames: fallbackList.length,
      source: 'GAMES_LIST',
    };

    return { games: fallbackList, status };
  }
}

export const cloudGamesService = CloudGamesService.getInstance();
