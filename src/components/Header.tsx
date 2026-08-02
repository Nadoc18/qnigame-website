import React from 'react';
import { 
  BookOpen, 
  Gamepad2, 
  Newspaper, 
  User, 
  Flame, 
  Volume2, 
  VolumeX, 
  Search, 
  UserCheck,
  Trophy
} from 'lucide-react';
import { UserProfile } from '../types';
import { soundManager } from '../utils/audio';
import { QnigameLogo } from './QnigameLogo';

interface HeaderProps {
  activeTab: 'landing' | 'news' | 'leaderboard' | 'account';
  setActiveTab: (tab: 'landing' | 'news' | 'leaderboard' | 'account') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  user: UserProfile;
  soundOn: boolean;
  setSoundOn: (v: boolean | ((prev: boolean) => boolean)) => void;
  onOpenGame?: (gameId: string) => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  user,
  soundOn,
  setSoundOn,
  onOpenAuthModal,
}) => {
  const toggleSound = () => {
    setSoundOn(prev => {
      const next = !prev;
      soundManager.enabled = next;
      if (next) soundManager.playClick();
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-40 transition-all duration-300 bg-gradient-to-r from-[#11230e]/95 via-[#1c3817]/95 to-[#0e1e0b]/95 border-b border-emerald-500/25 text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      {/* Top Gaming LED Line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 shadow-[0_0_12px_rgba(42,177,101,0.6)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Subtle Ambient Gaming Grid Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#2ab165_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.07] pointer-events-none" />

        <div className="flex items-center justify-between h-20 gap-4 relative z-10">
          
          {/* Logo with White Frame */}
          <div 
            onClick={() => { setActiveTab('landing'); soundManager.playClick(); }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
             <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black shrink-0 hidden lg:inline-block shadow-[0_0_10px_rgba(245,194,66,0.2)]">
              בס״ד
            </span>
            <QnigameLogo className="h-11 sm:h-12" />
           
          </div>

          {/* Gamer Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full group">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 transition-transform group-focus-within:scale-110" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 חפש משחק, נושא או פרשה..."
                className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-black/35 border border-emerald-500/25 text-sm text-white placeholder-emerald-200/50 focus:outline-none focus:ring-2 focus:ring-[#f5c242] focus:border-transparent transition-all shadow-inner backdrop-blur-md"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-emerald-300/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center transition-all"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Gamer Navigation Tabs */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => { setActiveTab('landing'); soundManager.playClick(); }}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'landing'
                  ? 'bg-gradient-to-r from-[#f5c242] to-[#e5af24] text-[#122810] shadow-[0_0_18px_rgba(245,194,66,0.45)] scale-105 border border-amber-200'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <Gamepad2 className={`w-4 h-4 ${activeTab === 'landing' ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">ספריית משחקים</span>
            </button>

            <button
              onClick={() => { setActiveTab('leaderboard'); soundManager.playClick(); }}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-[#f5c242] to-[#e5af24] text-[#122810] shadow-[0_0_18px_rgba(245,194,66,0.45)] scale-105 border border-amber-200'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">טבלת המובילים</span>
            </button>

            <button
              onClick={() => { setActiveTab('news'); soundManager.playClick(); }}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'news'
                  ? 'bg-gradient-to-r from-[#f5c242] to-[#e5af24] text-[#122810] shadow-[0_0_18px_rgba(245,194,66,0.45)] scale-105 border border-amber-200'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">חדשות</span>
            </button>

            {/* Account Tab - Only when user is logged in */}
            {user.isFirebaseUser && (
              <button
                onClick={() => { setActiveTab('account'); soundManager.playClick(); }}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'account'
                    ? 'bg-gradient-to-r from-[#f5c242] to-[#e5af24] text-[#122810] shadow-[0_0_18px_rgba(245,194,66,0.45)] scale-105 border border-amber-200'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">החשבון שלי</span>
              </button>
            )}

            {/* Account Login / Status Button */}
            <button
              onClick={() => {
                if (user.isFirebaseUser) {
                  setActiveTab('account');
                } else if (onOpenAuthModal) {
                  onOpenAuthModal();
                }
                soundManager.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                user.isFirebaseUser
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,194,66,0.2)]'
              }`}
              title={user.isFirebaseUser ? `מחובר בתור ${user.username || user.email}` : 'לחץ להתחברות לחשבון'}
            >
              <UserCheck className={`w-3.5 h-3.5 ${user.isFirebaseUser ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="truncate max-w-[110px] sm:max-w-[150px]">
                {user.isFirebaseUser ? (user.username || user.email?.split('@')[0] || 'מחובר') : 'התחברות'}
              </span>
            </button>

            {/* Quick RPG HUD User Card - Only when user is logged in */}
            {user.isFirebaseUser && (
              <button
                onClick={() => { setActiveTab('account'); soundManager.playClick(); }}
                className="hidden xl:flex items-center gap-2.5 bg-black/40 border border-emerald-500/30 hover:border-amber-400/80 px-3 py-1.5 rounded-2xl transition-all shadow-md group hover:scale-105"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-black text-slate-950 shadow-inner group-hover:rotate-12 transition-transform">
                  🏆
                </div>
                <div className="text-right leading-none">
                  <div className="text-xs font-black text-[#f5c242] flex items-center gap-1">
                    <span>{user.points}</span>
                    <span className="text-[10px] text-amber-200/80">נק׳</span>
                  </div>
                  <div className="text-[10px] text-emerald-300 font-bold truncate max-w-[80px] mt-0.5">{user.title}</div>
                </div>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundOn ? 'השתק צלילים' : 'הפעל צלילים'}
              className="p-2.5 rounded-xl bg-black/30 border border-emerald-500/30 text-white hover:bg-emerald-950/60 hover:border-emerald-400/50 transition-all active:scale-95"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-[#f5c242]" /> : <VolumeX className="w-4 h-4 text-emerald-400/60" />}
            </button>

          </nav>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3.5">
          <div className="relative w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 חפש משחק, נושא או פרשה..."
              className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-black/35 border border-emerald-500/30 text-sm text-white placeholder-emerald-200/50 focus:outline-none focus:ring-2 focus:ring-[#f5c242] backdrop-blur-md"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

