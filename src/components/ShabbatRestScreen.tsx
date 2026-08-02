import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Moon, Clock, Heart, Shield, RefreshCw } from 'lucide-react';
import { QnigameLogo } from './QnigameLogo';
import { ShabbatInfo } from '../utils/shabbat';

interface ShabbatRestScreenProps {
  shabbatInfo: ShabbatInfo;
  isTestMode?: boolean;
  onExitTestMode?: () => void;
}

export const ShabbatRestScreen: React.FC<ShabbatRestScreenProps> = ({
  shabbatInfo,
  isTestMode = false,
  onExitTestMode,
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      if (!shabbatInfo.havdalahDate) {
        setTimeLeftStr('');
        return;
      }
      const now = new Date();
      const diffMs = shabbatInfo.havdalahDate.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeftStr('מוצאי שבת קודש - שבוע טוב!');
        return;
      }
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeftStr(`${hours} שעות, ${mins} דקות ו-${secs} שניות`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [shabbatInfo.havdalahDate]);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#0e0a06] via-[#1c130a] to-[#0c180a] text-amber-100 font-sans flex flex-col justify-between"
      dir="rtl"
    >
      {/* Test Mode Top Bar Notice */}
      {isTestMode && (
        <div className="bg-amber-500/20 border-b border-amber-400/40 px-4 py-2.5 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between text-xs sm:text-sm font-bold text-amber-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] animate-pulse">
              🧪 מצב בדיקה
            </span>
            <span>זוהי תצוגה מקדימה של מצב שבת עבור פיתוח ובדיקות</span>
          </div>
          {onExitTestMode && (
            <button
              onClick={onExitTestMode}
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-transform hover:scale-105 shadow"
            >
              יציאה ממצב בדיקה ✕
            </button>
          )}
        </div>
      )}

      {/* Ambient Shabbat Candle Glow Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo Bar */}
      <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
        <QnigameLogo className="h-12 sm:h-14" />
        <div className="inline-flex items-center gap-2 text-xs font-black px-4 py-2 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Moon className="w-4 h-4 text-amber-400" />
          <span>בס״ד • שבת קודש</span>
        </div>
      </header>

      {/* Main Center Shabbat Rest Showcase */}
      <main className="max-w-3xl mx-auto px-4 py-8 text-center space-y-8 relative z-10 my-auto">
        
        {/* Animated Candles Art */}
        <div className="flex items-center justify-center gap-8 py-2">
          <div className="relative group">
            <div className="w-10 h-32 bg-gradient-to-t from-amber-100 to-white rounded-t-full shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-amber-200/50 relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-10 bg-gradient-to-t from-amber-500 via-amber-300 to-amber-100 rounded-full animate-bounce shadow-[0_0_20px_rgba(245,158,11,0.9)]" />
            </div>
            <div className="w-14 h-4 bg-amber-700/80 rounded-full mx-auto mt-1 border border-amber-500/40 shadow-inner" />
          </div>

          <div className="text-4xl text-amber-400/40 font-serif">✦</div>

          <div className="relative group">
            <div className="w-10 h-32 bg-gradient-to-t from-amber-100 to-white rounded-t-full shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-amber-200/50 relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-10 bg-gradient-to-t from-amber-500 via-amber-300 to-amber-100 rounded-full animate-bounce shadow-[0_0_20px_rgba(245,158,11,0.9)] [animation-delay:200ms]" />
            </div>
            <div className="w-14 h-4 bg-amber-700/80 rounded-full mx-auto mt-1 border border-amber-500/40 shadow-inner" />
          </div>
        </div>

        {/* Main Shabbat Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-sm font-black tracking-wide shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>שַׁבָּת שָׁלוֹם וּמְבוֹרָךְ</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-amber-200 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] tracking-tight">
            האתר במנוחת שבת קודש
          </h1>

          <p className="text-base sm:text-xl text-amber-100/90 font-medium max-w-xl mx-auto leading-relaxed pt-2">
            פורטל <span className="text-amber-400 font-bold">קניגיים Qnigame</span> שובת מכל מלאכה ופעילות בשבת קודש. 
            נשמח לראותכם ולשחק יחד שוב במוצאי שבת!
          </p>
        </div>

        {/* Shabbat Times Info Card */}
        <div className="bg-black/50 border-2 border-amber-500/30 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-lg mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
            <div className="text-right">
              <span className="text-xs text-amber-300/70 font-semibold block">פרשת השבוע</span>
              <span className="text-lg font-black text-amber-200">{shabbatInfo.parasha}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shadow">
              📜
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/20">
              <span className="text-xs text-amber-300/80 font-bold block mb-1">כניסת שבת</span>
              <span className="text-2xl font-black font-mono text-amber-400">{shabbatInfo.candleLightingStr}</span>
            </div>
            <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/20">
              <span className="text-xs text-amber-300/80 font-bold block mb-1">יציאת שבת</span>
              <span className="text-2xl font-black font-mono text-amber-400">{shabbatInfo.havdalahStr}</span>
            </div>
          </div>

          {timeLeftStr && (
            <div className="pt-2 text-xs text-amber-300/90 font-medium flex items-center justify-center gap-2 bg-amber-500/10 py-2.5 rounded-xl border border-amber-400/20">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>זמן משוער ליציאת השבת: <strong>{timeLeftStr}</strong></span>
            </div>
          )}
        </div>

        {/* Verse Box */}
        <div className="italic text-sm sm:text-base text-amber-200/90 max-w-md mx-auto font-serif pt-2">
          "וְקָרָאתָ לַשַּׁבָּת עֹנֶג, לִקְדוֹשׁ ה' מְכֻבָּד"
          <div className="text-xs text-amber-400/70 not-italic font-sans font-bold mt-1">(ישעיהו נ"ח, י"ג)</div>
        </div>

      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-amber-300/60 font-semibold relative z-10 border-t border-amber-500/10 bg-black/40">
        <div>© קניגיים Qnigame • שומרים שבת כהלכה</div>
      </footer>
    </div>
  );
};
