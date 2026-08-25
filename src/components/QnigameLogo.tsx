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
            alt="קניגיים Qnigame" 
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
  const totalSlides = featuredNews.length; // only show news slides

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % totalSlides);
    }, 6000); // cycle every 6 seconds
    return () => clearInterval(timer);
  }, [totalSlides, currentNewsIndex]);

  // We no longer render a logo here, so handleError is not needed

  return (
    <div className="relative group bg-white rounded-3xl shadow-2xl border-2 border-amber-400 hover:border-amber-500 transition-all text-center flex flex-col overflow-hidden h-[300px] sm:h-[380px]">
      {/* Background glow behind white card */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Featured News Carousel */}
      <div className="w-full h-full flex flex-col relative">
        {totalSlides === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 w-full h-full p-4 bg-slate-50">
             <img src={imgSrc} alt="Qnigame" className="h-20 object-contain drop-shadow-sm grayscale opacity-30" />
          </div>
        ) : (
          <div 
            className="w-full animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full cursor-pointer group"
            onClick={onOpenNews}
            title="לחץ לקריאת כל החדשות"
          >
            {/* Header Badge */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 text-xs sm:text-sm font-black text-white bg-[#2fab65] px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-md">
              <Newspaper className="w-4 h-4" />
              <span>חדשות חמות 🔥</span>
            </div>
            
            {/* Media Thumbnail */}
            {((featuredNews[currentNewsIndex]?.mediaType === 'image' || featuredNews[currentNewsIndex]?.imageUrl) && (featuredNews[currentNewsIndex]?.mediaUrl || featuredNews[currentNewsIndex]?.imageUrl)) && (
              <div className="w-full h-40 sm:h-52 bg-slate-100 overflow-hidden relative shrink-0">
                <img src={featuredNews[currentNewsIndex]?.mediaUrl || featuredNews[currentNewsIndex]?.imageUrl} alt={featuredNews[currentNewsIndex]?.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            )}
            {featuredNews[currentNewsIndex]?.mediaType === 'video' && featuredNews[currentNewsIndex]?.mediaUrl && (
              <div className="w-full h-40 sm:h-52 bg-slate-900 relative flex items-center justify-center overflow-hidden shrink-0">
                {(isYouTube(featuredNews[currentNewsIndex]?.mediaUrl!) || featuredNews[currentNewsIndex]?.imageUrl) ? (
                  <img 
                    src={isYouTube(featuredNews[currentNewsIndex]?.mediaUrl!) ? `https://img.youtube.com/vi/${getYouTubeId(featuredNews[currentNewsIndex]?.mediaUrl!)}/mqdefault.jpg` : featuredNews[currentNewsIndex]?.imageUrl} 
                    alt="Video Thumbnail" 
                    className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center opacity-80" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-[#2fab65] transition-colors shadow-lg">
                    <Play className="w-5 h-5 text-white ml-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-5 sm:p-6 text-right flex-1 flex flex-col justify-center relative bg-white">
              <h4 className="text-lg sm:text-xl font-black text-slate-800 line-clamp-2 mb-2 group-hover:text-[#2fab65] transition-colors">{featuredNews[currentNewsIndex]?.title}</h4>
              <p className="text-base sm:text-lg text-slate-500 line-clamp-2 leading-relaxed">{featuredNews[currentNewsIndex]?.excerpt || featuredNews[currentNewsIndex]?.content}</p>
              
              <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1.5 rounded-full shadow border border-slate-100 text-[#2fab65] z-10 hidden sm:block">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
        
        {/* Carousel Controls */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 z-20">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentNewsIndex(idx); }}
                className={`transition-all rounded-full shadow-sm ${
                  idx === currentNewsIndex 
                    ? 'w-6 h-1.5 bg-[#2fab65]' 
                    : 'w-1.5 h-1.5 bg-slate-300 hover:bg-[#2fab65]/50'
                }`}
                aria-label={`Go to news ${idx}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
