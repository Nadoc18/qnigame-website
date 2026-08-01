import React from 'react';
import { Flame, Moon, Sparkles, X } from 'lucide-react';

interface ShabbatBannerProps {
  shabbatMode: boolean;
  onClose: () => void;
}

export const ShabbatBanner: React.FC<ShabbatBannerProps> = ({ shabbatMode, onClose }) => {
  if (!shabbatMode) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 border-b border-amber-600/40 text-amber-100 py-3 px-4 shadow-xl relative animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-sm text-amber-200 flex items-center gap-2 justify-center sm:justify-start">
              <span>🕯️ שבת שלום ומבורכת! מצב שבת פעיל בפורטל</span>
            </div>
            <p className="text-xs text-amber-300/80">
              הפורטל במצב מנוחה. האתר מזכיר לשמור על קדושת השבת.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full font-mono">
            "וְקָרָאתָ לַשַּׁבָּת עֹנֶג"
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-800/50 text-amber-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
