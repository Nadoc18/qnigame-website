import React, { useState } from 'react';
import { Sparkles, Gamepad2 } from 'lucide-react';

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
        <img 
          src={imgSrc} 
          alt="קניגיים Qnigame - זה יצרת לשחק בו" 
          className="h-full w-auto object-contain filter drop-shadow-sm"
          referrerPolicy="no-referrer"
          onError={handleError}
        />
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

export const LogoShowcaseCard: React.FC = () => {
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
    <div className="relative group bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-amber-400 hover:border-amber-500 transition-all text-center flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow behind white card */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Badge */}
      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black px-3.5 py-1 rounded-full shadow-sm mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>פורטל המשחקים הרשמי</span>
      </div>

      {/* Prominent Large Logo Image */}
      <div className="w-full py-2 px-4 flex items-center justify-center">
        {!hasError ? (
          <img 
            src={imgSrc} 
            alt="קניגיים Qnigame - זה יצרת לשחק בו" 
            className="w-full max-w-[320px] sm:max-w-[380px] h-auto object-contain filter drop-shadow-md transition-transform group-hover:scale-102"
            referrerPolicy="no-referrer"
            onError={handleError}
          />
        ) : (
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 shadow-md">
              <Gamepad2 className="w-10 h-10" />
            </div>
            <span className="text-2xl font-black text-slate-800">Qnigame קניגיים</span>
          </div>
        )}
      </div>

      {/* Tagline Footer */}
      <p className="mt-3 text-xs sm:text-sm font-black text-slate-700 tracking-wide">
        "זה יצרת לשחק בו" — לימוד וכיף לכל המשפחה
      </p>
    </div>
  );
};
