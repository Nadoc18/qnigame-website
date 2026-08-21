import React, { useState, useEffect } from 'react';
import { Game, GameCategory, NewsArticle, UserProfile, getGameThumbnailUrl, getGameThumbnailBgClass } from '../types';
import { 
  Gamepad2, 
  Sparkles, 
  Star, 
  Play, 
  Heart, 
  HelpCircle, 
  Flame, 
  Newspaper, 
  Search, 
  Filter, 
  TrendingUp, 
  ShieldCheck, 
  BookOpen, 
  Award,
  Crown,
  ChevronRight,
  Zap,
  Lock,
  ThumbsUp,
  X,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { LogoShowcaseCard, LOGO_SRC, FALLBACK_LOGO_SRC } from './QnigameLogo';

const isYouTube = (url: string) => url && (url.includes('youtube.com') || url.includes('youtu.be'));

const getYouTubeEmbedUrl = (url: string) => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : url;
};

const getYouTubeId = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

interface LandingPageProps {
  games: Game[];
  news: NewsArticle[];
  user: UserProfile;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: GameCategory;
  setSelectedCategory: (cat: GameCategory) => void;
  onSelectGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onOpenNews: (articleId: string) => void;
}

const CATEGORIES: GameCategory[] = [
  'הכל',
  'פרשת השבוע',
  'תנ"ך',
  'שבת וחגים',
  'הלכה',
  'חשיבה',
  'טריוויה',
];

const getGameTypeHebrew = (type: string) => {
  if (type === 'trivia') return 'טריוויה';
  if (type === 'pixijs' || type === 'arcade') return 'ארקייד';
  if (type === 'casual') return 'קזואל';
  if (type === 'puzzle') return 'פאזלים';
  if (type === 'action') return 'פעולה';
  if (type === 'tanach_wordle') return 'משחקי מילים';
  if (type === 'menorah_puzzle') return 'פאזלים';
  if (type === 'brachot' || type === 'shabbat') return 'הלכה למעשה';
  return 'שונות';
};

const GAME_TYPES_OPTIONS = ['הכל', 'טריוויה', 'ארקייד', 'קזואל', 'פעולה', 'משחקי מילים', 'פאזלים', 'הלכה למעשה', 'שונות'];
const AGE_OPTIONS = ['הכל', 'לכל המשפחה', 'מגיל 4', 'מגיל 6', 'מגיל 8', 'מגיל 10', 'מגיל 12'];

export const LandingPage: React.FC<LandingPageProps> = ({
  games,
  news,
  user,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onSelectGame,
  onToggleFavorite,
  onOpenNews,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('הכל');
  const [selectedGameType, setSelectedGameType] = useState<string>('הכל');
  const [selectedAge, setSelectedAge] = useState<string>('הכל');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'new' | 'play_time'>('popular');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedGameModal, setSelectedGameModal] = useState<Game | null>(null);

  const [guestLikes, setGuestLikes] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('qnigame_guest_news_likes');
      if (saved) {
        setGuestLikes(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const isLiked = (item: NewsArticle) => {
    if (user?.isFirebaseUser) {
      return item.likedBy?.includes(user.id) || false;
    }
    return guestLikes.includes(item.id);
  };

  // Auto-filter by user age when it loads
  useEffect(() => {
    if (user && user.age) {
      if (user.age < 6) setSelectedAge('מגיל 4');
      else if (user.age < 8) setSelectedAge('מגיל 6');
      else if (user.age < 10) setSelectedAge('מגיל 8');
      else if (user.age < 12) setSelectedAge('מגיל 10');
      else setSelectedAge('מגיל 12');
    }
  }, [user]);

  // Filter games based on search, category, difficulty, game type, age
  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.title.includes(searchQuery) ||
      (game.subtitle || '').includes(searchQuery) ||
      game.description.includes(searchQuery) ||
      game.tags.some((t) => t.includes(searchQuery));

    const matchesCategory =
      selectedCategory === 'הכל' || 
      (Array.isArray(game.category) ? game.category.includes(selectedCategory) : game.category === selectedCategory);

    const matchesDifficulty =
      selectedDifficulty === 'הכל' || game.difficulty === selectedDifficulty;

    const matchesGameType = 
      selectedGameType === 'הכל' || 
      (Array.isArray(game.gameType) 
        ? game.gameType.some(gt => getGameTypeHebrew(gt) === selectedGameType)
        : getGameTypeHebrew(game.gameType) === selectedGameType);

    let matchesAge = true;
    if (selectedAge !== 'הכל') {
      if (selectedAge === 'לכל המשפחה') {
        matchesAge = game.ageRating.includes('לכל המשפחה');
      } else {
        const filterMinAge = parseInt(selectedAge.match(/\d+/)?.[0] || '0');
        const gameMinAge = parseInt(game.ageRating.match(/\d+/)?.[0] || '0');
        if (game.ageRating.includes('לכל המשפחה')) {
          matchesAge = true;
        } else {
          matchesAge = gameMinAge <= filterMinAge;
        }
      }
    }

    return matchesSearch && matchesCategory && matchesDifficulty && matchesGameType && matchesAge;
  }).sort((a, b) => {
    if (sortBy === 'popular') return b.playCount - a.playCount;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'new') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    if (sortBy === 'play_time') return (b.totalTimePlayed || 0) - (a.totalTimePlayed || 0);
    return 0;
  });

  const featuredGamesList = games.filter((g) => g.isPopular);
  const featuredGames = featuredGamesList.length > 0 ? featuredGamesList : games.slice(0, 3);
  const featuredGame = featuredGames[featuredIndex] || games[0];

  useEffect(() => {
    if (featuredGames.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredGames.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featuredGames.length, featuredIndex]);

  if (!featuredGame) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#c99719] rounded-full animate-spin mx-auto"></div>
        <h2 className="text-lg font-bold text-slate-600">טוען משחקים מהשרת...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#349352] via-[#233a18] to-[#2f4d21] border-b border-[#3e632c] pt-8 pb-16 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
            {/* Huge Glowing Logo */}
            <div className="flex justify-center lg:justify-start mb-6">
              <div className="relative group bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-[#c99719] hover:border-[#e5af24] transition-all inline-flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 bg-white blur-xl transition-colors" />
                 <img 
                   src={LOGO_SRC} 
                   alt="קניגיים Qnigame - פלטפורמת משחקי קודש" 
                   className="w-full max-w-[320px] sm:max-w-[480px] lg:max-w-[550px] h-auto object-contain filter drop-shadow-2xl relative z-10 transition-transform group-hover:scale-105"
                   onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_LOGO_SRC; }}
                 />
              </div>
            </div>

            <div className="inline-flex items-center px-8 py-4 rounded-full bg-[#c99719]/20 border border-[#c99719]/50 text-[#f5d77f] text-3xl font-black shadow-inner">
              <span>שחק. למד. התקדם.</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              משחקים תורניים וערכיים <br />
              <span className="text-[#c99719] drop-shadow-md">
                לכל המשפחה והגילאים
              </span>
            </h1>

            <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              ספריית משחקי דפדפן אינטראקטיביים בתנ״ך, משנה, גמרא, הלכה, מוסר, חסידות ועוד.
              שחק באופן מיידי, צבור נקודות ותגים, והתקדם בדרגות התורה והדעת!
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => { soundManager.playClick(); onSelectGame(featuredGame.id); }}
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#c99719] hover:bg-[#e5af24] text-[#2f4d21] font-black text-base transition-all shadow-xl shadow-amber-950/30 hover:scale-105"
              >
                <Play className="w-5 h-5 fill-[#2f4d21]" />
                <span>שחק עכשיו: {featuredGame.title}</span>
              </button>

              <a
                href="#game-library"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#233a18] hover:bg-[#253e1a] text-white font-bold text-base transition-all border border-[#3e632c] shadow-md"
              >
                <Gamepad2 className="w-5 h-5 text-[#c99719]" />
                <span>ספריית המשחקים</span>
              </a>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#3e632c] max-w-md mx-auto lg:mx-0">
              <div>
                <div className="text-2xl font-black text-[#c99719]">6+</div>
                <div className="text-xs text-emerald-200 font-semibold">משחקים חינמיים</div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#c99719]">24/6</div>
                <div className="text-xs text-emerald-200 font-semibold">זמינות מכל מכשיר</div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#c99719]">100%</div>
                <div className="text-xs text-emerald-200 font-semibold">תוכן מבוקר וערכי</div>
              </div>
            </div>
          </div>

          {/* Hero Spotlight & Logo Card */}
          <div className="lg:col-span-5 space-y-6">
            <LogoShowcaseCard news={news} onOpenNews={onOpenNews} />

            <div 
              onClick={() => { soundManager.playClick(); setSelectedGameModal(featuredGame); }}
              className="relative group bg-white/95 border-2 border-[#c99719] hover:border-[#e5af24] rounded-3xl shadow-2xl transition-all overflow-hidden cursor-pointer"
            >
              {featuredGame.isNew && (
                <div className="absolute top-4 right-4 z-20 bg-rose-500 text-white text-sm sm:text-base font-black px-4 py-1.5 rounded-full shadow-md">
                  חדש
                </div>
              )}
              <div className="absolute top-4 left-4 z-10 bg-[#c99719] text-[#2f4d21] text-sm sm:text-base font-black px-4 py-1.5 rounded-full shadow-md">
                🔥 משחק השבוע
              </div>

              <div className={`h-72 sm:h-[320px] bg-gradient-to-br ${getGameThumbnailBgClass(featuredGame)} flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform`}>
                {getGameThumbnailUrl(featuredGame) && (
                  <img
                    src={getGameThumbnailUrl(featuredGame)}
                    alt={featuredGame.title}
                    className="absolute inset-0 w-full h-full object-cover object-[center_25%] z-0 transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
              </div>

              <div className="text-right p-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#2fab65] transition-colors">
                    {featuredGame.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {featuredGame.isAdminOnly && (
                      <span title="סודי (גלוי רק למנהל)" className="text-[11px] bg-slate-100 text-slate-600 px-2 rounded-full font-bold border border-slate-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        סודי
                      </span>
                    )}
                    <div className="text-[11px] text-[#2fab65] font-black uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {featuredGame.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1 text-[#c99719] font-bold">
                    <Star className="w-4 h-4 fill-[#c99719] text-[#c99719]" />
                    {featuredGame.rating} ({featuredGame.ratingCount})
                  </span>
                  <span>{(featuredGame.playCount || 0).toLocaleString()} שחקנים</span>
                </div>

                {/* Carousel Controls */}
                {featuredGames.length > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4 pt-2">
                    {featuredGames.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setFeaturedIndex(idx);
                          soundManager.playClick();
                        }}
                        className={`transition-all rounded-full ${
                          idx === featuredIndex 
                            ? 'w-6 h-2 bg-[#c99719]' 
                            : 'w-2 h-2 bg-slate-300 hover:bg-[#c99719]/50'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Game Library Container */}
      <section id="game-library" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Section Header & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                <Gamepad2 className="w-7 h-7 text-[#2fab65]" />
                <span>ספריית המשחקים</span>
              </h2>
              <p className="text-sm text-slate-600 mt-1 font-medium">
                בחר משחק והחל לשחק מיד במסגרת המשחק האינטראקטיבית
              </p>
            </div>

            {/* Sorting Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 font-bold hidden sm:inline">מיון לפי:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'popular' | 'rating' | 'new' | 'play_time')}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2fab65] shadow-sm"
              >
                <option value="popular">הפופולריים ביותר (מספר משחקים)</option>
                <option value="rating">המדורגים ביותר</option>
                <option value="new">חדשים ראשונים</option>
                {user.isAdmin && (
                  <option value="play_time">זמן משחק כולל (מנהל)</option>
                )}
              </select>
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">סוג לימוד</label>
              <select
                value={selectedCategory}
                onChange={(e) => { soundManager.playClick(); setSelectedCategory(e.target.value as GameCategory); }}
                className="bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2fab65] shadow-sm appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%232fab65\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">סוג משחק</label>
              <select
                value={selectedGameType}
                onChange={(e) => { soundManager.playClick(); setSelectedGameType(e.target.value); }}
                className="bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2fab65] shadow-sm appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%232fab65\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
              >
                {GAME_TYPES_OPTIONS.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">התאמת גיל</label>
              <select
                value={selectedAge}
                onChange={(e) => { soundManager.playClick(); setSelectedAge(e.target.value); }}
                className="bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2fab65] shadow-sm appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%232fab65\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
              >
                {AGE_OPTIONS.map(age => <option key={age} value={age}>{age}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => {
            const isFav = user.favoriteGameIds.includes(game.id);

            return (
              <div
                key={game.id}
                onClick={() => { soundManager.playClick(); setSelectedGameModal(game); }}
                className="group relative bg-white border border-slate-200 hover:border-[#2fab65] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1.5 flex flex-col justify-between cursor-pointer"
              >
                {game.isNew && (
                  <div className="absolute top-4 right-4 z-20 bg-rose-600 text-white text-sm font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white animate-pulse">
                    חדש!
                  </div>
                )}
                <div>
                  {/* Thumbnail */}
                  <div className={`h-56 sm:h-64 bg-gradient-to-br ${getGameThumbnailBgClass(game)} p-4 flex flex-col justify-between relative overflow-hidden`}>
                    {getGameThumbnailUrl(game) && (
                      <img
                        src={getGameThumbnailUrl(game)}
                        alt={game.title}
                        className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {game.isAdminOnly && (
                          <span title="סודי (גלוי רק למנהל)" className="text-[11px] font-black px-3 py-1 rounded-full bg-slate-800/80 backdrop-blur-md text-white border border-slate-600 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            סודי
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playClick();
                          onToggleFavorite(game.id);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition-all ${
                          isFav
                            ? 'bg-rose-500 text-white'
                            : 'bg-[#2f4d21]/60 text-white hover:bg-[#2f4d21]/90'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-white font-bold bg-[#2f4d21]/50 px-2.5 py-0.5 rounded-md backdrop-blur-sm relative z-10">
                      <span>{game.difficulty}</span>
                      <span>{game.ageRating}</span>
                    </div>
                  </div>

                  {/* Title only */}
                  <div className="p-3 text-center border-t border-slate-100">
                    <h3 className="font-black text-slate-900 text-base group-hover:text-[#2fab65] transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                  </div>
                </div>

                {/* Admin Stats Badge */}
                {user.isAdmin && (
                  <div className="px-5 pb-2">
                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 flex flex-col gap-1 text-[10px] font-bold text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Gamepad2 className="w-3 h-3 text-emerald-600" /> שוחק:</span>
                        <span className="text-emerald-700">{(game.playCount || 0).toLocaleString()} פעמים</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Play className="w-3 h-3 text-amber-500" /> זמן כולל:</span>
                        <span className="text-amber-600">
                          {game.totalTimePlayed ? (
                            game.totalTimePlayed >= 3600 
                              ? `${Math.floor(game.totalTimePlayed / 3600)} שעות ו-${Math.floor((game.totalTimePlayed % 3600) / 60)} דק׳`
                              : `${Math.floor(game.totalTimePlayed / 60)} דק׳`
                          ) : '0 דק׳'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <Search className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">לא נמצאו משחקים</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              נסה לשנות את מילות החיפוש או לבחור קטגוריה אחרת.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('הכל'); }}
              className="px-4 py-2 bg-[#c99719] text-[#2f4d21] font-black text-xs rounded-xl"
            >
              איפוס מסננים
            </button>
          </div>
        )}

      </section>

      {/* News & Updates Section (חדשות ועדכונים) */}
      <section className="bg-emerald-50/60 border-y border-emerald-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Newspaper className="w-6 h-6 text-[#2fab65]" />
                <span>חדשות ועדכונים ב"קניגיים"</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                טורים חינוכיים, עדכוני גרסאות והשקות משחקים חדשים
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                onClick={() => { soundManager.playClick(); onOpenNews(item.id); }}
                className="bg-white border border-slate-200 hover:border-[#2fab65] rounded-2xl cursor-pointer transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                {(item.mediaType === 'image' || item.imageUrl) && (item.mediaUrl || item.imageUrl) && (
                  <div className="w-full h-32 bg-slate-100 overflow-hidden relative">
                    <img src={item.mediaUrl || item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                )}
                {item.mediaType === 'video' && item.mediaUrl && (
                  <div className="w-full h-32 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                    {(isYouTube(item.mediaUrl) || item.imageUrl) ? (
                      <img 
                        src={isYouTube(item.mediaUrl) ? `https://img.youtube.com/vi/${getYouTubeId(item.mediaUrl)}/mqdefault.jpg` : item.imageUrl} 
                        alt="Video Thumbnail" 
                        className="w-full h-full object-cover opacity-60 transition-transform group-hover:scale-105" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center opacity-80" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-[#2fab65] transition-colors">
                        <Play className="w-4 h-4 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-3 flex flex-col flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-emerald-50 text-[#2f4d21] border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                      {item.category}
                    </span>
                    <span className="text-slate-400 font-medium">{item.date}</span>
                  </div>

                  <h3 className="font-black text-slate-900 text-xl sm:text-2xl group-hover:text-[#2fab65] transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 line-clamp-3 leading-relaxed font-medium flex-1">
                    {item.excerpt || item.content}
                  </p>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <div className="flex items-center gap-1">
                      <span>מאת: {item.author}</span>
                      {isLiked(item) && (
                        <span className="mr-2 text-[#c99719] flex items-center gap-1 bg-[#c99719]/10 px-1.5 py-0.5 rounded">
                          <ThumbsUp className="w-3 h-3 fill-[#c99719]" />
                          <span>אהבת</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[#2fab65] font-bold group-hover:underline">קרא כתבה ➔</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values & Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border-2 border-emerald-100 rounded-3xl p-8 sm:p-12 space-y-8 shadow-lg">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              למה לבחור בפורטל "קניגיים"?
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              ערכים, למידה חווייתית וסביבה בטוחה לכל משפחה שומרת תורה ומצוות
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50/80 border border-slate-200 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-[#2f4d21] flex items-center justify-center shadow-inner">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-base">תוכן תורני איכותי</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                כל המשחקים נבנים בקפידה עם מקורות מן התנ"ך, המשנה וההלכה, ומלווים בהסברים מחכימים.
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-[#2fab65] flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-base">ללא פרסומות לא הולמות</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                סביבת משחק נקייה, מוגנת ובטוחה לילדים ולנוער, המותאמת לערכי הבית היהודי.
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-[#c99719] flex items-center justify-center shadow-inner">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-base">חשבון אישי והישגים</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                צבור נקודות, פתח תגים, שמור משחקים מועדפים והתקדם בדרגת התורה האישית שלך!
              </p>
            </div>
          </div>
        </div>
      </section>

    
      {/* Game Details Popup Modal */}
      {selectedGameModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => { soundManager.playClick(); setSelectedGameModal(null); }}
        >
          <div 
            className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => { soundManager.playClick(); setSelectedGameModal(null); }}
              className="absolute top-3 right-3 z-30 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className={`h-64 bg-gradient-to-br ${getGameThumbnailBgClass(selectedGameModal)} p-4 flex flex-col justify-between relative overflow-hidden`}>
              {getGameThumbnailUrl(selectedGameModal) && (
                <img
                  src={getGameThumbnailUrl(selectedGameModal)}
                  alt={selectedGameModal.title}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              )}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedGameModal.isAdminOnly && (
                    <span className="text-[11px] font-black px-3 py-1 rounded-full bg-slate-800/80 backdrop-blur-md text-white border border-slate-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      סודי
                    </span>
                  )}
                  {selectedGameModal.isNew && (
                    <span className="text-[11px] font-black px-3 py-1 rounded-full bg-rose-600 text-white border-2 border-white shadow-lg animate-pulse">
                      חדש!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white font-bold bg-[#2f4d21]/50 px-2.5 py-0.5 rounded-md backdrop-blur-sm relative z-10">
                <span>{selectedGameModal.difficulty}</span>
                <span>{selectedGameModal.ageRating}</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <h3 className="font-black text-slate-900 text-2xl">
                {selectedGameModal.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {selectedGameModal.subtitle || selectedGameModal.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {(selectedGameModal.tags || []).map((tag) => (
                  <span key={tag} className="text-xs bg-emerald-50 text-[#2f4d21] font-bold px-2 py-1 rounded-md border border-emerald-100">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-1 text-sm text-[#c99719] font-extrabold">
                <Star className="w-5 h-5 fill-[#c99719] text-[#c99719]" />
                <span>{selectedGameModal.rating} ({selectedGameModal.ratingCount})</span>
              </div>

              <button
                onClick={() => { 
                  soundManager.playClick(); 
                  onSelectGame(selectedGameModal.id);
                  setSelectedGameModal(null);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2fab65] hover:bg-[#28995a] text-white font-black text-sm transition-all shadow-md hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>שחק עכשיו</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
