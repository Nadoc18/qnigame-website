import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { Newspaper, ThumbsUp, MessageSquare, Calendar, User, Clock, ArrowRight, X, Sparkles, Tag, Play, ExternalLink, Lock } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { UserProfile } from '../types';
import { toggleNewsArticleLike } from '../lib/firebase';

const isYouTube = (url: string) => url && (url.includes('youtube.com') || url.includes('youtu.be'));

const getYouTubeId = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

const getYouTubeEmbedUrl = (url: string) => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1` : url;
};

interface NewsPageProps {
  articles: NewsArticle[];
  selectedArticleId?: string;
  user?: UserProfile;
  onOpenAuthModal?: () => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({ articles, selectedArticleId, user, onOpenAuthModal }) => {
  const [activeCategory, setActiveCategory] = useState<string>('הכל');
  const [readingArticleId, setReadingArticleId] = useState<string | null>(selectedArticleId || null);
  const readingArticle = articles.find(a => a.id === readingArticleId) || null;

  const categories = ['הכל', 'עדכוני משחקים', 'טור השבוע', 'הלכה וטכנולוגיה'];

  const filtered = articles.filter(a => activeCategory === 'הכל' || a.category === activeCategory);

  const [guestLikes, setGuestLikes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('qnigame_guest_news_likes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isLiked = (item: NewsArticle) => {
    if (user?.isFirebaseUser) {
      return item.likedBy?.includes(user.id) || false;
    }
    return guestLikes.includes(item.id);
  };

  const getLikesCount = (item: NewsArticle) => {
    const dbLikes = item.likes || 0;
    if (user?.isFirebaseUser) return dbLikes;
    return guestLikes.includes(item.id) ? dbLikes + 1 : dbLikes;
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    if (!user || !user.isFirebaseUser) {
      setGuestLikes(prev => {
        const currentlyLiked = prev.includes(id);
        const newLikes = currentlyLiked ? prev.filter(l => l !== id) : [...prev, id];
        localStorage.setItem('qnigame_guest_news_likes', JSON.stringify(newLikes));
        return newLikes;
      });
      return;
    }
    toggleNewsArticleLike(id, user.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c99719]/15 border border-[#c99719]/40 text-[#c99719] text-xs font-bold mb-2">
            <Newspaper className="w-3.5 h-3.5" />
            <span>חדשות ועדכונים</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900">חדשות "קניגיים"</h1>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            טורים חינוכיים, סיכומים תורניים ועדכוני משחקים חדשים בפורטל
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { soundManager.playClick(); setActiveCategory(cat); }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-[#c99719] text-[#2f4d21] font-black shadow-md shadow-amber-900/20'
                  : 'bg-white text-slate-700 hover:text-[#2fab65] border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <article
            key={item.id}
            onClick={() => { soundManager.playClick(); setReadingArticleId(item.id); }}
            className="bg-white border border-slate-200 hover:border-[#2fab65] rounded-2xl flex flex-col cursor-pointer transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md overflow-hidden"
          >
            {/* Thumbnail for grid if image or video */}
            {(item.mediaType === 'image' || item.imageUrl) && (item.mediaUrl || item.imageUrl) && (
              <div className="w-full h-40 bg-slate-100 overflow-hidden relative">
                <img src={item.mediaUrl || item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              </div>
            )}
            {item.mediaType === 'video' && item.mediaUrl && (
              <div className="w-full h-40 bg-slate-900 relative flex items-center justify-center overflow-hidden">
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
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-[#2fab65] transition-colors">
                    <Play className="w-5 h-5 text-white ml-1" />
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
              <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-[#2f4d21] border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                    {item.category}
                  </span>
                  {item.isAdminOnly && (
                    <span title="סודי (גלוי רק למנהל)" className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold border border-slate-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      סודי
                    </span>
                  )}
                </div>
                <span className="text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {item.readTime}
                </span>
              </div>

              <h2 className="font-black text-slate-900 text-2xl group-hover:text-[#2fab65] transition-colors line-clamp-2">
                {item.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-600 font-medium line-clamp-3 leading-relaxed">
                {item.excerpt || item.content}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#2fab65]" />
                <span className="line-clamp-1">{item.author}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleLike(item.id, e)}
                  className={`flex items-center gap-1 transition-colors ${isLiked(item) ? 'text-[#c99719]' : 'text-slate-400 hover:text-[#c99719]'}`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isLiked(item) ? 'fill-[#c99719]' : ''}`} />
                  <span className="flex items-center gap-1">
                    {getLikesCount(item)}
                    {isLiked(item) && (
                      <span className="text-[10px] bg-[#c99719]/15 px-1.5 py-0.5 rounded font-bold">אהבת</span>
                    )}
                  </span>
                </button>
              </div>
            </div>
            </div>
          </article>
        ))}
      </div>

      {/* Article Detail Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white border border-emerald-100 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden dir-rtl">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-emerald-50/50 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-[#2f4d21] border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {readingArticle.category}
                  </span>
                  {readingArticle.isAdminOnly && (
                    <span title="סודי (גלוי רק למנהל)" className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      סודי
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{readingArticle.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#2fab65]" />
                    {readingArticle.author}
                  </span>
                  <span>• {readingArticle.date}</span>
                  <span>• זמן קריאה: {readingArticle.readTime}</span>
                </div>
              </div>

              <button
                onClick={() => setReadingArticleId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Article Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              
              {/* Media Section */}
              {(readingArticle.mediaType === 'image' || readingArticle.imageUrl) && (readingArticle.mediaUrl || readingArticle.imageUrl) && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-[400px] flex items-center justify-center bg-slate-50">
                  <img src={readingArticle.mediaUrl || readingArticle.imageUrl} alt={readingArticle.title} className="max-w-full max-h-[400px] object-contain" />
                </div>
              )}

              {readingArticle.mediaType === 'video' && readingArticle.mediaUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-black flex items-center justify-center">
                  {readingArticle.mediaUrl.toLowerCase().endsWith('.mp4') ? (
                    <video 
                      src={readingArticle.mediaUrl} 
                      controls 
                      playsInline
                      className="w-full h-full"
                    />
                  ) : (
                    <iframe 
                      src={isYouTube(readingArticle.mediaUrl) ? getYouTubeEmbedUrl(readingArticle.mediaUrl) : readingArticle.mediaUrl} 
                      title="Video player" 
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                    />
                  )}
                </div>
              )}

              <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/80 text-amber-900 italic font-semibold text-base leading-relaxed">
                "{readingArticle.excerpt}"
              </div>

              <div className="leading-loose text-slate-700 font-medium text-base">
                {readingArticle.content}
              </div>

              {/* Link Section */}
              {readingArticle.mediaType === 'link' && readingArticle.linkUrl && (
                <div className="pt-4 flex justify-center">
                  <a 
                    href={readingArticle.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#2fab65] hover:bg-[#269053] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>לחץ כאן למעבר לקישור המלא</span>
                  </a>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                {readingArticle.tags.map(t => (
                  <span key={t} className="text-xs bg-slate-100 text-slate-600 font-medium px-3 py-1 rounded-lg border border-slate-200">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={(e) => handleLike(readingArticle.id, e)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  isLiked(readingArticle) 
                    ? 'bg-[#c99719]/20 border-[#c99719]/60 text-[#a37812]' 
                    : 'bg-[#c99719]/15 border-[#c99719]/40 text-[#8c670d] hover:bg-[#c99719]/25'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked(readingArticle) ? 'fill-[#c99719]' : ''}`} />
                <span>{isLiked(readingArticle) ? 'אהבת את הכתבה!' : 'לייק לכתבה'} ({getLikesCount(readingArticle)})</span>
              </button>

              <button
                onClick={() => setReadingArticleId(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
              >
                סגור
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
