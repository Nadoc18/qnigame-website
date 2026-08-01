import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  KeyRound, 
  UserCheck, 
  ShieldCheck 
} from 'lucide-react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  logout, 
  resetPassword 
} from '../lib/firebase';
import { soundManager } from '../utils/audio';
import { UserProfile } from '../types';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onAuthSuccess?: () => void;
  customMessage?: string;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  customMessage,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        soundManager.playCorrect();
        setSuccessMsg('התחברת בהצלחה! הישגייך נשמרו בחשבונך.');
        setTimeout(() => {
          onClose();
          if (onAuthSuccess) onAuthSuccess();
        }, 1200);
      } else if (mode === 'register') {
        if (!email || !password) {
          throw new Error('אנא מלא את כל השדות.');
        }
        if (password.length < 6) {
          throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים.');
        }
        await registerWithEmail(email, password);
        soundManager.playCorrect();
        setSuccessMsg('החשבון נוצר בהצלחה! הישגייך נשמרו בחשבונך.');
        setTimeout(() => {
          onClose();
          if (onAuthSuccess) onAuthSuccess();
        }, 1200);
      } else if (mode === 'forgot') {
        if (!email) throw new Error('אנא הזן כתובת אימייל.');
        await resetPassword(email);
        soundManager.playCorrect();
        setSuccessMsg('קישור לאיפוס סיסמה נשלח למייל שלך!');
      }
    } catch (err: any) {
      soundManager.playWrong();
      console.error('Auth Error:', err);
      let message = 'אירעה שגיאה. אנא נסה שנית.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'כתובת האימייל או הסיסמה אינם נכונים.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'כתובת האימייל כבר רשומה במערכת.';
      } else if (err.code === 'auth/weak-password') {
        message = 'הסיסמה חלשה מדי. נדרשים לפחות 6 תווים.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'כתובת האימייל אינה תקינה.';
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      soundManager.playCorrect();
      setSuccessMsg('התחברת בהצלחה באמצעות גוגל!');
      setTimeout(() => {
        onClose();
        if (onAuthSuccess) onAuthSuccess();
      }, 1200);
    } catch (err: any) {
      soundManager.playWrong();
      console.error('Google Login Error:', err);
      setErrorMsg('התחברות באמצעות גוגל בוטלה או נכשלה.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      soundManager.playClick();
      setSuccessMsg('התנתקת בהצלחה.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Logout Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg border border-emerald-400/40">
            <UserCheck className="w-7 h-7 text-amber-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {currentUser.isFirebaseUser ? 'חשבון שחקן מחובר' : mode === 'login' ? 'התחברות לחשבון' : mode === 'register' ? 'יצירת חשבון שחקן' : 'איפוס סיסמה'}
          </h2>
          <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto">
            {customMessage 
              ? customMessage 
              : currentUser.isFirebaseUser 
                ? 'הנתונים, הנקודות והמשחקים המועדפים שלך נשמרים ומגובים בחשבונך האישי'
                : 'התחבר כדי לשמור את הישגי המשחק, הנקודות והמועדפים שלך בכל מכשיר'}
          </p>
        </div>

        {/* If Already Logged In as User */}
        {currentUser.isFirebaseUser ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>מחובר בתור: {currentUser.username}</span>
              </div>
              {currentUser.email && (
                <div className="text-xs text-slate-600 font-mono bg-white px-3 py-1.5 rounded-xl border border-emerald-200 inline-block">
                  {currentUser.email}
                </div>
              )}
              <div className="flex justify-center items-center gap-2 text-xs text-emerald-700 font-bold pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>שמירת הישגים פעילה</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>התנתק מהחשבון</span>
            </button>
          </div>
        ) : (
          /* Form for Login / Register / Forgot */
          <div className="space-y-5">
            
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl text-xs font-black">
              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className={`py-2 rounded-xl transition-all ${mode === 'login' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                התחברות
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); resetForm(); }}
                className={`py-2 rounded-xl transition-all ${mode === 'register' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                הרשמה חדשה
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google Quick Login Button */}
            {mode !== 'forgot' && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-sm hover:border-slate-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>התחברות מהירה באמצעות Google</span>
              </button>
            )}

            {mode !== 'forgot' && (
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-extrabold text-slate-400 absolute">או באמצעות אימייל</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>כתובת אימייל</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 dir-ltr font-mono"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>סיסמה</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 dir-ltr font-mono"
                  />
                </div>
              )}

              {/* Forgot password trigger */}
              {mode === 'login' && (
                <div className="text-left">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); resetForm(); }}
                    className="text-xs text-emerald-700 hover:underline font-bold"
                  >
                    שכחת סיסמה?
                  </button>
                </div>
              )}

              {/* Back from forgot password */}
              {mode === 'forgot' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); resetForm(); }}
                    className="text-xs text-emerald-700 hover:underline font-bold"
                  >
                    &larr; חזרה להתחברות
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>התחבר לחשבון</span>
                  </>
                ) : mode === 'register' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>צור חשבון חדש</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>שלח קישור לאיפוס</span>
                  </>
                )}
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
};
