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
  isPopular?: boolean;
  isNew?: boolean;
}

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
  userName: string;
  userAvatar: string;
  userTitle: string;
  rating: number;
  content: string;
  timestamp: string;
  likes: number;
}
