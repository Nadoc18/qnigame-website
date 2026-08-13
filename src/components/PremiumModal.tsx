import React, { useState } from 'react';
import { X, Crown, Sparkles, CheckCircle2, ShieldCheck, Gamepad2, ArrowRight } from 'lucide-react';
import { UserProfile, SubscriptionTier } from '../types';
import { paymentService } from '../services/paymentService';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  requiredTier?: SubscriptionTier;
  onMockPaymentSuccess: (tier: SubscriptionTier) => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, user, requiredTier, onMockPaymentSuccess }) => {
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);

  if (!isOpen) return null;

  const currentTier = user.subscriptionTier || 'FREE';

  // Helper to determine if a tier is already owned or included
  const hasTier = (tier: SubscriptionTier) => {
    if (currentTier === 'TIER_2') return true; // Premium has everything
    if (currentTier === 'TIER_1' && tier === 'TIER_1') return true;
    return false;
  };

  const handlePayment = async (tier: SubscriptionTier) => {
    if (!user.isFirebaseUser) {
      alert('עליך להתחבר קודם כדי לרכוש מנוי!');
      return;
    }
    
    setLoadingTier(tier);
    try {
      const result = await paymentService.createCheckoutSession(tier);
      
      if (result.checkoutUrl) {
        // Redirect to Morning Pay checkout page
        window.location.href = result.checkoutUrl;
      } else if (result.mockMode) {
        // Fallback for testing before API keys are added
        alert('בסביבת הייצור (Production), תועבר כעת לעמוד התשלום המאובטח של Morning Pay.\n\nלצורך בדיקה, המנוי הופעל בהצלחה בחשבונך!');
        onMockPaymentSuccess(tier);
      }
    } catch (error) {
      alert('שגיאה ביצירת תהליך התשלום. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white border-2 border-indigo-500 rounded-3xl max-w-4xl w-full shadow-2xl relative overflow-hidden my-8 animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-[280px] sm:h-64 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 opacity-90 pointer-events-none" />
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-5 right-20 w-24 h-24 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors z-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Content */}
        <div className="relative pt-10 pb-6 px-8 text-center text-white z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-amber-300/50">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black mb-2">
            {requiredTier ? 'המשחק הזה דורש מנוי!' : 'שדרג את החוויה שלך'}
          </h2>
          <p className="text-indigo-100 font-medium max-w-md mx-auto">
            {requiredTier 
              ? 'כדי לשחק במשחק זה, עליך לשדרג את חשבונך לאחד מהמסלולים הבאים.' 
              : 'הצטרף למנויי הפרימיום שלנו וקבל גישה למשחקים בלעדיים, שמירת הישגים ועוד.'}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 sm:p-8 grid md:grid-cols-2 gap-6 bg-slate-50 relative z-10">
          
          {/* TIER 1 : Standard */}
          <div className={`bg-white rounded-2xl p-6 border-2 shadow-sm relative flex flex-col ${hasTier('TIER_1') ? 'border-emerald-500 opacity-90' : 'border-slate-200 hover:border-indigo-300 transition-colors'}`}>
            {hasTier('TIER_1') && currentTier !== 'TIER_2' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>המנוי הנוכחי שלך</span>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                <ShieldCheck className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">מנוי סטנדרט</h3>
                <p className="text-xs text-slate-500 font-bold">גישה למשחקים מתקדמים</p>
              </div>
            </div>

            <div className="my-6">
              <span className="text-4xl font-black text-slate-900">₪29</span>
              <span className="text-slate-500 font-medium"> / חודש</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>פתיחת משחקים עד גיל 9+</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>לגילאים בוגרים יותר: גישה חופשית למשחקים בדירוג "לכל המשפחה"</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>שמירת הישגים, ניקוד וטבלאות שיאים</span>
              </li>
            </ul>

            <button
              onClick={() => handlePayment('TIER_1')}
              disabled={hasTier('TIER_1') || loadingTier !== null || !user.isFirebaseUser}
              className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                hasTier('TIER_1')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              {loadingTier === 'TIER_1' ? (
                <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              ) : hasTier('TIER_1') ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>פעיל בחשבון זה</span>
                </>
              ) : (
                <>
                  <span>בחר במסלול סטנדרט</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* TIER 2 : Premium */}
          <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-2xl p-6 border-2 border-amber-400 shadow-xl relative flex flex-col transform md:-translate-y-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-indigo-950 text-xs font-black px-4 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>המשתלם ביותר</span>
            </div>

            {currentTier === 'TIER_2' && (
              <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-md">
                המנוי הנוכחי
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shrink-0 border border-amber-300/50 shadow-inner">
                <Crown className="w-6 h-6 text-indigo-950" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">מנוי פרימיום VIP</h3>
                <p className="text-xs text-indigo-200 font-bold">החוויה המלאה ללא הגבלות</p>
              </div>
            </div>

            <div className="my-6">
              <span className="text-4xl font-black text-white">₪59</span>
              <span className="text-indigo-300 font-medium"> / חודש</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2 text-sm text-indigo-100 font-medium">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span><strong className="text-white">גישה חופשית לכל המשחקים בכל הרמות</strong> (כולל רמת "מאתגר")</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-indigo-100 font-medium">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>גישה בלעדית למשחקים מרובי משתתפים (Multiplayer)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-indigo-100 font-medium">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>תג פרימיום מוזהב בפרופיל ובטבלאות</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-indigo-100 font-medium">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>שמירת התקדמות כפולה ב-Firebase</span>
              </li>
            </ul>

            <button
              onClick={() => handlePayment('TIER_2')}
              disabled={currentTier === 'TIER_2' || loadingTier !== null || !user.isFirebaseUser}
              className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                currentTier === 'TIER_2'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-indigo-950 border border-amber-300'
              }`}
            >
              {loadingTier === 'TIER_2' ? (
                <div className="w-5 h-5 border-2 border-indigo-950/30 border-t-indigo-950 rounded-full animate-spin" />
              ) : currentTier === 'TIER_2' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>המנוי שלך פעיל</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  <span>שדרג לפרימיום עכשיו</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Footer Warning */}
        <div className="bg-slate-100 p-4 text-center text-[10px] text-slate-400 font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>התשלום מאובטח ומוצפן בטכנולוגיות המתקדמות ביותר. ביטול מנוי אפשרי בכל עת.</span>
        </div>

      </div>
    </div>
  );
};
