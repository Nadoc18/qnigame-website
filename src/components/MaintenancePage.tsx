import React from 'react';
import { Settings, Shield, AlertTriangle } from 'lucide-react';

interface MaintenancePageProps {
  onOpenAuthModal: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onOpenAuthModal }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center dir-rtl relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="z-10 bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-12 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col items-center space-y-8 animate-fadeIn">
        
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-full animate-pulse" />
          <div className="w-24 h-24 bg-amber-500/20 border-2 border-amber-500 text-amber-500 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <Settings className="w-12 h-12 animate-[spin_4s_linear_infinite]" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            האתר בתחזוקה
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-lg mx-auto leading-relaxed">
            אנו מבצעים כעת עבודות שדרוג ותחזוקה במערכת כדי לשפר את החוויה שלכם.
            <br className="hidden sm:block" /> האתר יחזור לפעילות בהקדם!
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 pt-6 w-full max-w-sm">
          <div className="flex items-center gap-2 text-amber-400 font-bold bg-amber-400/10 px-4 py-2 rounded-full border border-amber-400/20">
            <AlertTriangle className="w-5 h-5" />
            <span>תודה על הסבלנות</span>
          </div>
        </div>

      </div>

      {/* Hidden Admin Login Button */}
      <div className="absolute bottom-6 left-6 z-20">
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-800"
          title="כניסת מנהל למערכת"
        >
          <Shield className="w-4 h-4" />
          <span>התחברות</span>
        </button>
      </div>

    </div>
  );
};
