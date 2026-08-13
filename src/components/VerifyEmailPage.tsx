import React, { useEffect, useState } from 'react';
import { MailCheck, XCircle, Loader2 } from 'lucide-react';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface VerifyEmailPageProps {
  oobCode: string;
  onContinue: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ oobCode, onContinue }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('מאמת את כתובת המייל שלך...');

  useEffect(() => {
    const verify = async () => {
      try {
        await applyActionCode(auth, oobCode);
        
        // Reload the user if they are logged in so their emailVerified status updates immediately in the UI
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }

        setStatus('success');
        setMessage('כתובת המייל אומתה בהצלחה! איזה כיף שהצטרפת למשפחת קניגיים. 🎉');
        soundManager.playCorrect();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        if (error.code === 'auth/invalid-action-code') {
          setMessage('הקישור פג תוקף או שכבר נעשה בו שימוש. (אם כבר אימתת את המייל בעבר, תוכל פשוט להמשיך)');
        } else {
          setMessage('אירעה שגיאה באימות כתובת המייל. אנא נסה שוב מאוחר יותר.');
        }
        soundManager.playWrong();
      }
    };

    if (oobCode) {
      verify();
    }
  }, [oobCode]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans" dir="rtl">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border-t-8 border-emerald-500 relative overflow-hidden">
        
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-6 flex justify-center">
            {status === 'loading' && (
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <MailCheck className="w-10 h-10 text-emerald-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-rose-600" />
              </div>
            )}
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-2">
            {status === 'loading' ? 'מאמת...' : 
             status === 'success' ? 'האימות הושלם!' : 
             'שגיאה באימות'}
          </h1>
          
          <p className="text-slate-600 font-medium leading-relaxed mb-8">
            {message}
          </p>

          {status !== 'loading' && (
            <button
              onClick={onContinue}
              className="w-full py-4 rounded-xl font-black text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
            >
              המשך לקניגיים
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
