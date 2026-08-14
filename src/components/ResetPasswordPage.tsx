import React, { useState } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { auth } from '../lib/firebase';
import { confirmPasswordReset } from 'firebase/auth';
import { soundManager } from '../utils/audio';

interface ResetPasswordPageProps {
  oobCode: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ oobCode, onSuccess, onCancel }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('הסיסמה החדשה חייבת להכיל לפחות 6 תווים.');
      soundManager.playWrong();
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('הסיסמאות אינן תואמות. אנא נסה שוב.');
      soundManager.playWrong();
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      soundManager.playCorrect();
      onSuccess();
    } catch (err: any) {
      soundManager.playWrong();
      // silent
      if (err.code === 'auth/expired-action-code') {
        setErrorMsg('פג תוקפו של קישור זה. אנא בקש קישור חדש.');
      } else if (err.code === 'auth/invalid-action-code') {
        setErrorMsg('הקישור אינו תקין או שכבר נעשה בו שימוש.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('הסיסמה חלשה מדי.');
      } else {
        setErrorMsg('אירעה שגיאה בעת עדכון הסיסמה. אנא נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center pt-20 px-4" dir="rtl">
      
      <div className="w-full max-w-md bg-white border-2 border-emerald-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-emerald-50 mb-4 shadow-inner">
            <KeyRound className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">איפוס סיסמה</h2>
          <p className="text-sm text-slate-500 mt-2 font-bold">הגדר סיסמה חדשה לחשבונך בקניגיים</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>סיסמה חדשה</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 pr-4 pl-12 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 dir-ltr font-mono text-lg transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>אימות סיסמה חדשה</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 pr-4 pl-12 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 dir-ltr font-mono text-lg transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-lg rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>שמור והתחבר</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>ביטול וחזרה לאתר</span>
          </button>
        </div>

      </div>
    </div>
  );
};
