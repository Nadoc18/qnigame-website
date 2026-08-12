import React, { useState, useEffect } from 'react';
import { Sparkles, Gamepad2, Newspaper, ArrowLeft, Play } from 'lucide-react';
import { NewsArticle } from '../types';

const isYouTube = (url: string) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export const LOGO_SRC = "/assets/qnigame_logo_main.png";
export const SECONDARY_LOGO_SRC = "/public/assets/qnigame_logo_main.png";
export const FALLBACK_LOGO_SRC = "/logo.png";

export const QnigameEmblem: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
  const [imgSrc, setImgSrc] = useState(LOGO_SRC);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (imgSrc === LOGO_SRC) {
      setImgSrc(SECONDARY_LOGO_SRC);
    } else if (imgSrc === SECONDARY_LOGO_SRC) {
      setImgSrc(FALLBACK_LOGO_SRC);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="bg-white p-1.5 rounded-xl shadow-sm inline-flex items-center justify-center border border-amber-200/80">
      {!hasError ? (
        <img 
          src={imgSrc} 
          alt="קניגיים" 
          className={`object-contain ${className}`}
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      ) : (
        <div className="flex items-center gap-1 text-emerald-800 font-black text-sm px-1">
          <Gamepad2 className="w-5 h-5 text-amber-500" />
          <span>Qnigame</span>
        </div>
      )}
    </div>
  );
};

export const QnigameLogo: React.FC<LogoProps> = ({ 
  className = "h-12",
  onClick
}) => {
  const [imgSrc, setImgSrc] = useState(LOGO_SRC);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (imgSrc === LOGO_SRC) {
      setImgSrc(SECONDARY_LOGO_SRC);
    } else if (imgSrc === SECONDARY_LOGO_SRC) {
      setImgSrc(FALLBACK_LOGO_SRC);
    } else {
      setHasError(true);
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none bg-white px-3 py-1 rounded-2xl shadow-md border-2 border-amber-300 hover:border-amber-400 hover:shadow-lg transition-all hover:scale-105 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {!hasError ? (
        <>
          {/* Full Logo (Desktop) */}
          <img 
            src={imgSrc} 
            alt="קניגיים Qnigame - זה יצרת לשחק בו" 
            className="hidden sm:block h-full w-auto object-contain filter drop-shadow-sm"
            referrerPolicy="no-referrer"
            onError={handleError}
          />
          {/* Compact Icon (Mobile) */}
          <img 
            src="/favicon.png" 
            alt="קניגיים Qnigame Icon" 
            className="block sm:hidden h-full w-auto object-contain filter drop-shadow-sm"
            referrerPolicy="no-referrer"
          />
        </>
      ) : (
        <div className="flex items-center gap-2 text-emerald-900 font-black text-lg px-1">
          <Gamepad2 className="w-6 h-6 text-amber-500 animate-pulse" />
          <span className="bg-gradient-to-r from-emerald-800 via-amber-600 to-emerald-900 bg-clip-text text-transparent">
            Qnigame קניגיים
          </span>
        </div>
      )}
    </div>
  );
};

interface LogoShowcaseCardProps {
  news?: NewsArticle[];
  onOpenNews?: () => void;
}

export const LogoShowcaseCard: React.FC<LogoShowcaseCardProps> = ({ news = [], onOpenNews }) => {
  const [imgSrc, setImgSrc] = useState(LOGO_SRC);
  const [hasError, setHasError] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  const featuredNews = news.filter(n => !n.isAdminOnly && n.isFeatured);
  const totalSlides = featuredNews.length + 1; // Slide 0 is the tagline, slides 1..N are news

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % totalSlides);
    }, 6000); // cycle every 6 seconds
    return () => clearInterval(timer);
  }, [totalSlides, currentNewsIndex]);

  // We no longer render a logo here, so handleError is not needed

  return (
    <div className="relative group bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-amber-400 hover:border-amber-500 transition-all text-center flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow behind white card */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Featured News Carousel */}
      <div className="w-full flex flex-col items-center flex-1 justify-center min-h-[160px] h-full">
        {currentNewsIndex === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 w-full h-full p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-lg sm:text-xl font-black text-[#2f4d21] tracking-wide text-center leading-relaxed drop-shadow-sm">
              "זה יצרת לשחק בו" <br/> לימוד וכיף לכל המשפחה
            </p>
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#2fab65] mb-2 bg-[#2fab65]/10 px-2.5 py-0.5 rounded-full mx-auto w-max">
              <Newspaper className="w-3.5 h-3.5" />
              <span>חדשות חמות</span>
            </div>
            
            <div 
              className="w-full flex-1 bg-white rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-[#2fab65] hover:shadow-md transition-all group relative overflow-hidden flex flex-col"
              onClick={onOpenNews}
              title="לחץ לקריאת כל החדשות"
            >
              {/* Media Thumbnail */}
              {((featuredNews[currentNewsIndex - 1]?.mediaType === 'image' || featuredNews[currentNewsIndex - 1]?.imageUrl) && (featuredNews[currentNewsIndex - 1]?.mediaUrl || featuredNews[currentNewsIndex - 1]?.imageUrl)) && (
                <div className="w-full h-24 sm:h-32 bg-slate-100 overflow-hidden relative">
                  <img src={featuredNews[currentNewsIndex - 1]?.mediaUrl || featuredNews[currentNewsIndex - 1]?.imageUrl} alt={featuredNews[currentNewsIndex - 1]?.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>
              )}
              {featuredNews[currentNewsIndex - 1]?.mediaType === 'video' && featuredNews[currentNewsIndex - 1]?.mediaUrl && (
                <div className="w-full h-24 sm:h-32 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                  {(isYouTube(featuredNews[currentNewsIndex - 1]?.mediaUrl!) || featuredNews[currentNewsIndex - 1]?.imageUrl) ? (
                    <img 
                      src={isYouTube(featuredNews[currentNewsIndex - 1]?.mediaUrl!) ? `https://img.youtube.com/vi/${getYouTubeId(featuredNews[currentNewsIndex - 1]?.mediaUrl!)}/mqdefault.jpg` : featuredNews[currentNewsIndex - 1]?.imageUrl} 
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

              {/* Content */}
              <div className="p-3 text-right flex-1 flex flex-col justify-center">
                <h4 className="text-sm sm:text-base font-black text-slate-800 line-clamp-1 mb-1 group-hover:text-[#2fab65] transition-colors">{featuredNews[currentNewsIndex - 1]?.title}</h4>
                <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">{featuredNews[currentNewsIndex - 1]?.excerpt || featuredNews[currentNewsIndex - 1]?.content}</p>
                
                <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-full shadow-sm text-[#2fab65] z-10">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Carousel Controls */}
        {totalSlides > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-4">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentNewsIndex(idx)}
                className={`transition-all rounded-full ${
                  idx === currentNewsIndex 
                    ? 'w-5 h-1.5 bg-[#2fab65]' 
                    : 'w-1.5 h-1.5 bg-slate-200 hover:bg-[#2fab65]/50'
                }`}
                aria-label={idx === 0 ? 'Go to tagline' : `Go to news ${idx}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
