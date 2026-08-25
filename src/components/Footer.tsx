import React from 'react';
import { Flame, Heart, Shield, Star, Award, Sparkles, BookOpen, Mail } from 'lucide-react';
import { QnigameLogo } from './QnigameLogo';
import { ShabbatInfo } from '../utils/shabbat';

interface FooterProps {
  shabbatInfo?: ShabbatInfo | null;
}

export const Footer: React.FC<FooterProps> = ({ shabbatInfo }) => {
  return (
    <footer className="relative bg-gradient-to-b from-[#11230e] via-[#0c1a0a] to-[#060e05] border-t border-emerald-500/20 text-emerald-100 pt-12 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Top Gaming LED Line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-[#f5c242] to-emerald-500 shadow-[0_0_12px_rgba(42,177,101,0.6)]" />

      {/* Subtle Ambient Gaming Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#2ab165_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 relative z-10">
        
        {/* About */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <QnigameLogo className="h-16" />
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-emerald-100/80 font-medium">
            הבית המוביל למשחקים תורניים וערכיים לכל המשפחה. לימוד תורה, תנ״ך, הלכה ומורשת דרך חוויה משחקית אינטראקטיבית.
          </p>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-[#f5c242] font-black mb-4 text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>קטגוריות משחקים</span>
          </h3>
          <ul className="space-y-3 text-sm sm:text-base font-bold">
            <li><a href="#all" className="text-emerald-100/90 hover:text-[#f5c242] transition-colors flex items-center gap-1.5"><span className="text-emerald-500">◀</span> הכל</a></li>
            <li><a href="#parasha" className="text-emerald-100/90 hover:text-[#f5c242] transition-colors flex items-center gap-1.5"><span className="text-emerald-500">◀</span> פרשת השבוע</a></li>
            <li><a href="#tanach" className="text-emerald-100/90 hover:text-[#f5c242] transition-colors flex items-center gap-1.5"><span className="text-emerald-500">◀</span> תנ"ך</a></li>
            <li><a href="#shabbat" className="text-emerald-100/90 hover:text-[#f5c242] transition-colors flex items-center gap-1.5"><span className="text-emerald-500">◀</span> שבת וחגים</a></li>
            <li><a href="#halacha" className="text-emerald-100/90 hover:text-[#f5c242] transition-colors flex items-center gap-1.5"><span className="text-emerald-500">◀</span> הלכה</a></li>
            <li><a href="#thinking" className="text-emerald-100/90 hover:text-[#f5c242] transition-colors flex items-center gap-1.5"><span className="text-emerald-500">◀</span> חשיבה</a></li>
            <li><a href="#trivia" className="text-emerald-100/90 hover:text-[#f5c242] transition-colors flex items-center gap-1.5"><span className="text-emerald-500">◀</span> טריוויה</a></li>
          </ul>
        </div>

        {/* Shabbat Times Box */}
        <div className="bg-black/40 border border-emerald-500/25 p-5 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-amber-400/40 transition-all">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 text-[#f5c242] font-black mb-4 text-lg">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span>זמני שבת קודש</span>
          </div>
          <div className="space-y-3 text-sm sm:text-base font-semibold">
            <div className="flex justify-between pb-2 border-b border-emerald-500/20">
              <span className="text-emerald-300 whitespace-nowrap">הפעלה אוטומטית:</span>
              <span className="text-emerald-400 font-bold whitespace-nowrap text-left max-w-[60%] truncate" title={`לפי מיקום (${shabbatInfo?.locationName || 'ירושלים'})`}>
                לפי מיקום ({shabbatInfo?.locationName || 'ירושלים'})
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-emerald-500/20">
              <span className="text-emerald-300">הדלקת נרות:</span>
              <span className="text-[#f5c242] font-mono font-black text-base">
                {shabbatInfo?.candleLightingStr || '19:18'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-300">יציאת שבת:</span>
              <span className="text-[#f5c242] font-mono font-black text-base">
                {shabbatInfo?.havdalahStr || '20:22'}
              </span>
            </div>
          </div>
        </div>

        {/* Values & Safety */}
        <div className="space-y-3">
          <h3 className="text-[#f5c242] font-black text-lg mb-4">איכות ובטיחות</h3>
          <div className="flex items-start gap-2.5 text-sm sm:text-base text-emerald-100/90 font-bold bg-black/20 p-3 rounded-xl border border-emerald-500/15">
            <Shield className="w-5 h-5 text-[#2fab65] shrink-0 mt-0.5" />
            <span>תוכן מבוקר ומפוקח ללא פרסומות לא הולמות.</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm sm:text-base text-emerald-100/90 font-bold bg-black/20 p-3 rounded-xl border border-emerald-500/15">
            <Award className="w-5 h-5 text-[#f5c242] shrink-0 mt-0.5" />
            <span>פותח בשיתוף מחנכים ואנשי תורה וטכנולוגיה.</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm sm:text-base text-emerald-100/90 font-bold bg-black/20 p-3 rounded-xl border border-emerald-500/15">
            <Star className="w-5 h-5 text-[#f5c242] shrink-0 mt-0.5" />
            <span>חווית משחק מלאה בדפדפן - ללא הורדות!</span>
          </div>
        </div>

      </div>

      {/* Contact Banner */}
      <div className="max-w-7xl mx-auto mb-8 bg-black/40 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 hover:border-[#2fab65]/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#2fab65]/20 rounded-full flex items-center justify-center border border-[#2fab65]/40 shrink-0">
            <Mail className="w-7 h-7 text-[#2fab65]" />
          </div>
          <div>
            <h3 className="text-[#f5c242] font-black text-lg">צרו קשר</h3>
            <p className="text-emerald-100/80 text-sm sm:text-base font-medium mt-1">
              לשאלות, דיווח על באגים, בקשות מיוחדות או סתם לפרגן לנו!
            </p>
          </div>
        </div>
        <a 
          href="mailto:info@qnigame.com" 
          className="px-6 py-3.5 bg-[#2fab65] hover:bg-[#269053] text-white text-base font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0 hover:-translate-y-1"
        >
          <Mail className="w-5 h-5" />
          <span>info@qnigame.com</span>
        </a>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between text-sm sm:text-base text-emerald-300/80 gap-4 font-bold relative z-10">
        <div>
          © 2024 קניגיים Qnigame .כל הזכויות שמורות.
        </div>
        <div className="flex items-center gap-1.5 text-emerald-200">
          <span>נבנה באהבה לחיזוק התורה במשפחות עם ישראל</span>
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline mx-1 animate-pulse" />
        </div>
      </div>
    </footer>
  );
};

