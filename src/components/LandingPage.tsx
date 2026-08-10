import React, { useState } from 'react';
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
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { LogoShowcaseCard } from './QnigameLogo';

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
  'תנ"ך ומורשת',
  'שבת וחגים',
  'ברכות והלכה',
  'חשיבה ופאזל',
  'טריוויה ודעת',
];

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
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'new'>('popular');

  // Filter games based on search, category, difficulty
  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.title.includes(searchQuery) ||
      game.description.includes(searchQuery) ||
      game.tags.some((t) => t.includes(searchQuery));

    const matchesCategory =
      selectedCategory === 'הכל' || game.category === selectedCategory;

    const matchesDifficulty =
      selectedDifficulty === 'הכל' || game.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  }).sort((a, b) => {
    if (sortBy === 'popular') return b.playCount - a.playCount;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'new') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    return 0;
  });

  const featuredGame = games.find((g) => g.isPopular) || games[0];

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#349352] via-[#233a18] to-[#2f4d21] border-b border-[#3e632c] pt-8 pb-16 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
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
              ספריית משחקי דפדפן אינטראקטיביים בתנ״ך, פרשת השבוע, הלכה, ברכות ושבת קודש.
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
                <div className="text-2xl font-black text-[#c99719]">50K+</div>
                <div className="text-xs text-emerald-200 font-semibold">משחקים שנערכו</div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#c99719]">100%</div>
                <div className="text-xs text-emerald-200 font-semibold">תוכן מבוקר וערכי</div>
              </div>
            </div>
          </div>

          {/* Hero Spotlight & Logo Card */}
          <div className="lg:col-span-5 space-y-6">
            <LogoShowcaseCard />

            <div className="relative group bg-white/95 border-2 border-[#c99719] hover:border-[#e5af24] p-5 rounded-3xl shadow-2xl transition-all overflow-hidden">
              {featuredGame.isNew && (
                <div className="absolute top-6 -right-12 w-44 text-center z-20 bg-rose-500 text-white text-base font-black py-2 shadow-lg transform rotate-45 border-y border-rose-400 pointer-events-none">
                  חדש
                </div>
              )}
              <div className="absolute top-4 left-4 z-10 bg-[#c99719] text-[#2f4d21] text-xs font-black px-3 py-1 rounded-full shadow-md">
                🔥 משחק השבוע
              </div>

              <div className={`h-36 rounded-2xl bg-gradient-to-br ${getGameThumbnailBgClass(featuredGame)} flex items-center justify-center mb-3 relative overflow-hidden group-hover:scale-[1.02] transition-transform`}>
                {getGameThumbnailUrl(featuredGame) && (
                  <img
                    src={getGameThumbnailUrl(featuredGame)}
                    alt={featuredGame.title}
                    className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="w-12 h-12 rounded-full bg-[#2f4d21]/80 backdrop-blur-md flex items-center justify-center text-white shadow-xl relative z-10">
                  <Play className="w-6 h-6 fill-[#c99719] text-[#c99719] translate-x-0.5" />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <div className="text-[11px] text-[#2fab65] font-black uppercase tracking-wide">
                  {featuredGame.category}
                </div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-[#2fab65] transition-colors">
                  {featuredGame.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                  {featuredGame.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1 text-[#c99719] font-bold">
                    <Star className="w-4 h-4 fill-[#c99719] text-[#c99719]" />
                    {featuredGame.rating} ({featuredGame.ratingCount})
                  </span>
                  <span>{featuredGame.playCount.toLocaleString()} שחקנים</span>
                </div>

                <button
                  onClick={() => { soundManager.playClick(); onSelectGame(featuredGame.id); }}
                  className="w-full mt-2 py-2.5 rounded-xl bg-[#2fab65] hover:bg-[#28995a] text-white font-black text-xs transition-all shadow-md text-center"
                >
                  פתח במסגרת המשחק
                </button>
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
                onChange={(e) => setSortBy(e.target.value as 'popular' | 'rating' | 'new')}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2fab65] shadow-sm"
              >
                <option value="popular">הפופולריים ביותר</option>
                <option value="rating">המדורגים ביותר</option>
                <option value="new">חדשים ראשונים</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { soundManager.playClick(); setSelectedCategory(cat); }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#2f4d21] text-white shadow-md shadow-emerald-950/20 scale-105'
                    : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-[#2fab65] border border-slate-200 shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => {
            const isFav = user.favoriteGameIds.includes(game.id);

            return (
              <div
                key={game.id}
                className="group relative bg-white border border-slate-200 hover:border-[#2fab65] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1.5 flex flex-col justify-between"
              >
                {game.isNew && (
                  <div className="absolute top-5 -right-12 w-40 text-center z-20 bg-rose-500 text-white text-sm font-black py-1.5 shadow-lg transform rotate-45 border-y border-rose-400 pointer-events-none">
                    חדש
                  </div>
                )}
                <div>
                  {/* Thumbnail */}
                  <div className={`h-40 bg-gradient-to-br ${getGameThumbnailBgClass(game)} p-4 flex flex-col justify-between relative overflow-hidden`}>
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-[#2f4d21]/80 backdrop-blur-md text-[#f5d77f] border border-[#c99719]/40">
                          {game.category}
                        </span>
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

                    <div className="text-center relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#2f4d21]/60 backdrop-blur-md border border-white/30 mx-auto flex items-center justify-center text-[#c99719] mb-2 shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-[#c99719] translate-x-0.5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-white font-bold bg-[#2f4d21]/50 px-2.5 py-0.5 rounded-md backdrop-blur-sm relative z-10">
                      <span>{game.difficulty}</span>
                      <span>{game.ageRating}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-black text-slate-900 text-lg group-hover:text-[#2fab65] transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                      {game.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {game.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] bg-emerald-50 text-[#2f4d21] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-[#c99719] font-extrabold">
                    <Star className="w-3.5 h-3.5 fill-[#c99719] text-[#c99719]" />
                    <span>{game.rating}</span>
                  </div>

                  <button
                    onClick={() => { soundManager.playClick(); onSelectGame(game.id); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c99719] hover:bg-[#e5af24] text-[#2f4d21] font-black text-xs transition-all shadow-sm"
                  >
                    <span>הפעל משחק</span>
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
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

                  <h3 className="font-black text-slate-900 text-base group-hover:text-[#2fab65] transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium flex-1">
                    {item.excerpt}
                  </p>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>מאת: {item.author}</span>
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

    </div>
  );
};
