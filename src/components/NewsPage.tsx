import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { Newspaper, ThumbsUp, MessageSquare, Calendar, User, Clock, ArrowRight, X, Sparkles, Tag } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface NewsPageProps {
  articles: NewsArticle[];
  selectedArticleId?: string;
}

export const NewsPage: React.FC<NewsPageProps> = ({ articles, selectedArticleId }) => {
  const [activeCategory, setActiveCategory] = useState<string>('הכל');
  const [readingArticle, setReadingArticle] = useState<NewsArticle | null>(
    selectedArticleId ? articles.find(a => a.id === selectedArticleId) || null : null
  );
  const [likesMap, setLikesMap] = useState<Record<string, number>>(
    articles.reduce((acc, a) => ({ ...acc, [a.id]: a.likes }), {})
  );

  const categories = ['הכל', 'עדכוני משחקים', 'טור השבוע', 'הלכה וטכנולוגיה'];

  const filtered = articles.filter(a => activeCategory === 'הכל' || a.category === activeCategory);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    setLikesMap(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
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
            onClick={() => { soundManager.playClick(); setReadingArticle(item); }}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 group space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                  {item.category}
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.readTime}
                </span>
              </div>

              <h2 className="font-bold text-white text-lg group-hover:text-amber-300 transition-colors line-clamp-2">
                {item.title}
              </h2>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {item.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="line-clamp-1">{item.author}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleLike(item.id, e)}
                  className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{likesMap[item.id] || 0}</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Article Detail Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden dir-rtl">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1 rounded-full font-bold">
                  {readingArticle.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{readingArticle.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    {readingArticle.author}
                  </span>
                  <span>• {readingArticle.date}</span>
                  <span>• זמן קריאה: {readingArticle.readTime}</span>
                </div>
              </div>

              <button
                onClick={() => setReadingArticle(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Article Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-amber-100/90 italic font-medium">
                "{readingArticle.excerpt}"
              </div>

              <div className="leading-loose text-slate-300">
                {readingArticle.content}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                {readingArticle.tags.map(t => (
                  <span key={t} className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-lg">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={(e) => handleLike(readingArticle.id, e)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>לייק לכתבה ({likesMap[readingArticle.id] || 0})</span>
              </button>

              <button
                onClick={() => setReadingArticle(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
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
