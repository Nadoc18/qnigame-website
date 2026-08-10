import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Sparkles, Star, Award, ChevronRight } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTitle: string;
  newLevel: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, newTitle, newLevel }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      soundManager.playCorrect(); // Optional: play a success sound
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-auto" dir="rtl">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`relative w-full max-w-md bg-gradient-to-br from-[#2fab65] via-emerald-700 to-slate-900 rounded-3xl shadow-2xl border-2 border-[#c99719]/40 overflow-hidden transform transition-all duration-500 ease-out ${
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
        }`}
      >
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#c99719] rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        </div>

        <div className="relative p-8 sm:p-10 text-center space-y-6">
          
          {/* Icon Badge */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#c99719] to-amber-300 rounded-full animate-pulse blur-xl opacity-40" />
            <div className="relative w-full h-full bg-gradient-to-tr from-[#c99719] to-amber-300 rounded-full p-1 shadow-xl">
              <div className="w-full h-full bg-emerald-800 rounded-full flex items-center justify-center border-4 border-amber-200/20">
                <Crown className="w-12 h-12 text-[#f5d77f] drop-shadow-md" />
              </div>
            </div>
            
            {/* Sparkles */}
            <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-amber-200 animate-bounce" />
            <Star className="absolute -bottom-2 -left-3 w-6 h-6 text-amber-300 animate-pulse delay-75" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#f5d77f] to-amber-200 drop-shadow-sm">
              מזל טוב! עלית דרגה!
            </h2>
            <p className="text-emerald-100/90 text-sm font-medium leading-relaxed">
              התמדתך בלימוד התורה והערכים נושאת פרי. הגעת להישג חדש במערכת הקניגיים.
            </p>
          </div>

          <div className="py-5 px-4 bg-black/30 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner space-y-2">
            <div className="text-amber-400/80 text-xs font-bold uppercase tracking-widest">
              הדרגה החדשה שלך
            </div>
            <div className="flex items-center justify-center gap-3">
              <Award className="w-6 h-6 text-[#c99719]" />
              <div className="text-2xl font-black text-white">
                {newTitle}
              </div>
            </div>
            <div className="text-emerald-300 font-semibold text-sm pt-1">
              רמה {newLevel}
            </div>
          </div>

          <button
            onClick={onClose}
            className="group w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c99719] to-amber-500 hover:from-amber-400 hover:to-amber-300 text-emerald-950 font-black text-base shadow-xl hover:shadow-amber-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>המשך לשחק</span>
            <ChevronRight className="w-5 h-5 opacity-70 group-hover:-translate-x-1 transition-transform rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
