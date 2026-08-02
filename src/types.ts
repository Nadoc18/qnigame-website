export type GameCategory = 
  | 'הכל'
  | 'פרשת השבוע'
  | 'תנ"ך ומורשת'
  | 'שבת וחגים'
  | 'ברכות והלכה'
  | 'חשיבה ופאזל'
  | 'טריוויה ודעת';

export interface GameFile {
  name: string;
  language: 'html' | 'css' | 'javascript';
  content: string;
}

export interface Game {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  category: GameCategory;
  difficulty: 'קל' | 'בינוני' | 'מאתגר' | 'לכל המשפחה';
  ageRating: string;
  playCount: number;
  rating: number;
  ratingCount: number;
  author: string;
  tags: string[];
  thumbnailBg: string;
  iconName: string;
  files: GameFile[];
  instructions: string[];
  torahSource: string;
  gameType: 'trivia' | 'brachot' | 'shabbat' | 'tanach_wordle' | 'menorah_puzzle' | string;
  externalUrl?: string;
  playUrl?: string;
  frameWidth?: string;
  frameHeight?: string;
  aspectRatio?: string;
  introVideoUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  image?: string;
  photo?: string;
  thumbnail_url?: string;
  image_url?: string;
  isPopular?: boolean;
  isNew?: boolean;
}

export const cleanImageUrl = (rawUrl?: string): string | undefined => {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const str = rawUrl.trim();
  if (!str) return undefined;

  // Convert Firebase gs:// URI to public HTTPS URL
  if (str.startsWith('gs://')) {
    const gsPath = str.slice(5);
    const firstSlashIdx = gsPath.indexOf('/');
    if (firstSlashIdx > 0) {
      const bucket = gsPath.slice(0, firstSlashIdx);
      const filePath = gsPath.slice(firstSlashIdx + 1);
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
    }
    return undefined;
  }

  // Allow standard web schemes
  if (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('data:') ||
    str.startsWith('blob:') ||
    str.startsWith('/') ||
    str.startsWith('./') ||
    str.startsWith('../')
  ) {
    if (str.includes('firebasestorage.googleapis.com') && !str.includes('alt=')) {
      const sep = str.includes('?') ? '&' : '?';
      return `${str}${sep}alt=media`;
    }
    return str;
  }

  // If it's a relative filename ending in an image extension
  if (/\.(png|jpg|jpeg|webp|svg|gif)(\?.*)?$/i.test(str)) {
    return str;
  }

  // Reject any unknown schemes (like intent://, app://, etc.) to prevent ERR_UNKNOWN_URL_SCHEME
  return undefined;
};

export const isImageUrl = (val?: string): boolean => {
  return cleanImageUrl(val) !== undefined;
};

export const getGameThumbnailUrl = (game?: Partial<Game> | Record<string, any>): string | undefined => {
  if (!game) return undefined;
  const val = (
    game.thumbnailUrl ||
    game.imageUrl ||
    game.thumbnail ||
    game.image ||
    game.photo ||
    game.thumbnail_url ||
    game.image_url
  );
  const cleanedVal = cleanImageUrl(val);
  if (cleanedVal) return cleanedVal;

  const cleanedBg = cleanImageUrl(game.thumbnailBg);
  if (cleanedBg) return cleanedBg;

  return undefined;
};

export const getGameThumbnailBgClass = (game?: Partial<Game> | Record<string, any>): string => {
  if (!game || !game.thumbnailBg || isImageUrl(game.thumbnailBg)) {
    return 'from-emerald-600 via-teal-700 to-emerald-900';
  }
  return game.thumbnailBg;
};

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
  category: string;
}

export interface GameStat {
  gameId: string;
  gameTitle: string;
  highScore: number;
  playsCount: number;
  lastPlayed: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  isFirebaseUser?: boolean;
  username: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  title: string;
  level: number;
  points: number;
  coins: number;
  avatarIcon: string;
  avatarBg: string;
  joinedDate: string;
  favoriteGameIds: string[];
  badges: Badge[];
  gameStats: Record<string, GameStat>;
  bio?: string;
  shabbatModeEnabled?: boolean;
  soundEnabled?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: 'עדכוני משחקים' | 'טור השבוע' | 'אירועים ותחרויות' | 'הלכה וטכנולוגיה';
  readTime: string;
  imageUrl?: string;
  likes: number;
  commentsCount: number;
  tags: string[];
}

export interface GameComment {
  id: string;
  gameId: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  userTitle: string;
  rating: number;
  content: string;
  timestamp: string;
  likes: number;
}
