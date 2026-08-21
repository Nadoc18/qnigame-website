import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Award, Star, Flame, Sparkles, User, ShieldCheck, Radio } from 'lucide-react';
import { UserProfile } from '../types';
import { getDisplayName } from '../utils/format';
import { subscribeToLeaderboard, updateLeaderboardEntry, LeaderboardEntry } from '../lib/firebase';

interface LeaderboardProps {
  currentUser: UserProfile;
  onOpenAuthModal?: () => void;
}

const EMOJI_TO_IMAGE: Record<string, string> = {
  '🎓': '/avatars/shofar.png',
  '✡️': '/avatars/torah.png',
  '🕍': '/avatars/kippa.png',
  '📜': '/avatars/siddur.png',
  '🦁': '/avatars/dreidel.png',
  '👑': '/avatars/rimon.png',
  '🕎': '/avatars/menorah.png',
  '🕯️': '/avatars/shofar.png',
  '🍷': '/avatars/tallit.png',
  '🍯': '/avatars/tzedakah.png',
  '✡': '/avatars/torah.png'
};

const getAvatarImage = (avatar: string | undefined): string => {
  if (!avatar) return '/avatars/shofar.png';
  if (avatar.startsWith('/')) return avatar;
  return EMOJI_TO_IMAGE[avatar] || '/avatars/shofar.png';
};

interface LeaderboardUser {
  id: string;
  rank: number;
  username: string;
  firstName?: string;
  lastName?: string;
  title: string;
  level: number;
  points: number;
  playsCount: number;
  avatarIcon: string;
  badgeCount: number;
  isCurrentUser?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser, onOpenAuthModal }) => {
  const [firebaseEntries, setFirebaseEntries] = useState<LeaderboardEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    // Live real-time subscription to Firebase Firestore
    const unsubscribe = subscribeToLeaderboard((entries) => {
      if (entries && entries.length > 0) {
        setFirebaseEntries(entries);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLocalSync = async () => {
    if (!currentUser.isFirebaseUser) {
      setSyncStatus('התחבר לחשבון שחקן כדי לבצע סנכרון מקומי');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('מסנכרן נתוני שחקנים...');
    try {
      await updateLeaderboardEntry(currentUser);
      setSyncStatus('סנכרון מקומי של השחקן הושלם בהצלחה!');
    } catch (err) {
      setSyncStatus('שגיאה בסנכרון המקומי');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const statsList = Object.values(currentUser.gameStats || {}) as Array<{ playsCount: number }>;
  const userPlaysCount = statsList.reduce((acc, s) => acc + (s.playsCount || 0), 0) || 15;

  // Map firebase entries into LeaderboardUser list
  const realUsersMap = new Map<string, Omit<LeaderboardUser, 'rank'>>();

  firebaseEntries.forEach((entry) => {
    realUsersMap.set(entry.id, {
      id: entry.id,
      username: entry.username,
      firstName: entry.firstName,
      lastName: entry.lastName,
      title: entry.title,
      level: entry.level,
      points: entry.points,
      playsCount: entry.playsCount || 0,
      avatarIcon: getAvatarImage(entry.avatarIcon),
      badgeCount: entry.badgeCount || 0,
      isCurrentUser: currentUser.isFirebaseUser && entry.id === currentUser.id,
    });
  });

  // Ensure current user is in list if logged in via Firebase
  if (currentUser.isFirebaseUser && currentUser.id && !realUsersMap.has(currentUser.id)) {
    realUsersMap.set(currentUser.id, {
      id: currentUser.id,
      username: currentUser.username,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      title: currentUser.title || 'תלמיד חכם',
      level: currentUser.level,
      points: currentUser.points,
      playsCount: userPlaysCount,
      avatarIcon: getAvatarImage(currentUser.avatarIcon),
      badgeCount: currentUser.badges.filter((b) => b.unlocked).length,
      isCurrentUser: true,
    });
  }

  const fullList: LeaderboardUser[] = Array.from(realUsersMap.values())
    .sort((a, b) => b.points - a.points)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

  const top3 = fullList.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-right" dir="rtl">
      
      {/* LOCAL TEST ONLY SYNC BUTTON (Never displayed in production) */}
      {(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) && (
        <div className="bg-slate-900 border-2 border-amber-400/50 rounded-2xl p-4 text-amber-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1 text-right">
            <span className="font-black text-amber-400 flex items-center gap-1.5 text-sm">
              <span>🛠️</span>
              <span>כפתור בדיקה מקומית (Local Test Only - מוסתר לחלוטין בפרודקשן!)</span>
            </span>
            <p className="text-slate-300 text-xs">
              לחץ כדי לסנכרן את הפרופיל והניקוד המקומי של השחקן.
            </p>
            {syncStatus && <p className="text-emerald-400 font-bold mt-1">{syncStatus}</p>}
          </div>
          <button
            onClick={handleLocalSync}
            disabled={isSyncing}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow transition-all shrink-0 disabled:opacity-50"
          >
            {isSyncing ? 'מסנכרן...' : 'סנכרון שחקן מקומי (Test)'}
          </button>
        </div>
      )}
      
      {/* Guest Notice Banner */}
      {!currentUser.isFirebaseUser && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border-2 border-amber-400/50 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-800">
          <div className="flex items-center gap-3 text-right">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl font-black shrink-0 shadow">
              🏆
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">רוצה להופיע בטבלת המובילים?</h3>
              <p className="text-xs text-slate-600 font-medium">התחבר לחשבון שחקן כדי שכל הנקודות וההישגים שלך יישמרו ותוכל להתחרות באלופים!</p>
            </div>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-transform hover:scale-105 shrink-0"
            >
              התחברות לחשבון שחקן
            </button>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2f4d21] via-[#233a18] to-[#2f4d21] border-2 border-[#3e632c] rounded-3xl p-6 sm:p-8 shadow-xl text-white relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center sm:text-right">
            <span className="text-xs px-3 py-1 rounded-full bg-[#c99719]/30 border border-[#c99719]/50 text-[#f5d77f] font-black inline-block">
              טבלת האלופים
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white">טבלת המובילים והאלופים</h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg font-medium">
              השחקנים והלומדים המובילים בניקוד, דרגות והישגי תורה (מוצג בראשי תיבות לשמירה על פרטיות).
            </p>
          </div>

          <div className="w-20 h-20 rounded-3xl bg-[#c99719] p-1 shadow-2xl flex items-center justify-center text-4xl shrink-0">
            🏆
          </div>
        </div>
      </div>

      {/* Top 3 Podium Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Rank 2 (Silver) */}
        {top3[1] && (
          <div className={`order-2 md:order-1 bg-white border-2 border-slate-300 rounded-3xl p-6 shadow-lg text-center space-y-3 relative overflow-hidden ${top3[1].isCurrentUser ? 'ring-4 ring-amber-400' : ''}`}>
            <div className="absolute top-3 right-3 text-2xl font-black text-slate-400">🥈 #2</div>
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-300 text-3xl mx-auto flex items-center justify-center shadow-md overflow-hidden">
              <img src={top3[1].avatarIcon} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">
                {getDisplayName(top3[1].username, top3[1].firstName, top3[1].lastName, top3[1].isCurrentUser, currentUser.isAdmin)}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-300 inline-block mt-1">
                {top3[1].title}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-xl font-black text-slate-800">{top3[1].points} <span className="text-xs text-slate-500 font-normal">נק׳</span></div>
              <div className="text-[11px] text-slate-500 font-bold mt-0.5">רמה {top3[1].level}</div>
            </div>
          </div>
        )}

        {/* Rank 1 (Gold Winner) */}
        {top3[0] && (
          <div className={`order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-amber-400/5 to-white border-4 border-amber-400 rounded-3xl p-7 shadow-2xl text-center space-y-4 relative overflow-hidden md:-translate-y-4 ${top3[0].isCurrentUser ? 'ring-4 ring-amber-500' : ''}`}>
            <div className="absolute top-3 right-3 text-3xl font-black text-amber-500">🥇 #1</div>
            <div className="w-20 h-20 rounded-3xl bg-amber-400 border-4 border-amber-300 text-4xl mx-auto flex items-center justify-center shadow-xl shadow-amber-400/30 overflow-hidden">
              <img src={top3[0].avatarIcon} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-xl">
                {getDisplayName(top3[0].username, top3[0].firstName, top3[0].lastName, top3[0].isCurrentUser, currentUser.isAdmin)}
              </h3>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-400/30 text-amber-900 font-black border border-amber-400 inline-block mt-1">
                👑 {top3[0].title}
              </span>
            </div>
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 p-3.5 rounded-2xl shadow-md">
              <div className="text-2xl font-black">{top3[0].points} <span className="text-xs font-bold">נק׳</span></div>
              <div className="text-[11px] font-extrabold mt-0.5">רמה {top3[0].level} • אלוף התורה</div>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {top3[2] && (
          <div className={`order-3 bg-white border-2 border-amber-700/30 rounded-3xl p-6 shadow-lg text-center space-y-3 relative overflow-hidden ${top3[2].isCurrentUser ? 'ring-4 ring-amber-400' : ''}`}>
            <div className="absolute top-3 right-3 text-2xl font-black text-amber-700">🥉 #3</div>
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 text-3xl mx-auto flex items-center justify-center shadow-md overflow-hidden">
              <img src={top3[2].avatarIcon} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">
                {getDisplayName(top3[2].username, top3[2].firstName, top3[2].lastName, top3[2].isCurrentUser, currentUser.isAdmin)}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-bold border border-amber-200 inline-block mt-1">
                {top3[2].title}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-xl font-black text-slate-800">{top3[2].points} <span className="text-xs text-slate-500 font-normal">נק׳</span></div>
              <div className="text-[11px] text-slate-500 font-bold mt-0.5">רמה {top3[2].level}</div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md">
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 font-black text-xs text-slate-700 grid grid-cols-12 gap-2">
          <div className="col-span-1 text-center">מיקום</div>
          <div className="col-span-5 sm:col-span-4">שחקן</div>
          <div className="hidden sm:block col-span-3">תואר תורני</div>
          <div className="col-span-3 sm:col-span-2 text-center">רמה</div>
          <div className="col-span-3 sm:col-span-2 text-left">ניקוד</div>
        </div>

        <div className="divide-y divide-slate-100">
          {fullList.length === 0 ? (
            <div className="p-10 text-center text-slate-500 space-y-3">
              <div className="text-4xl">🏆</div>
              <div className="font-black text-slate-800 text-base">עדיין אין שחקנים רשומים בטבלת המובילים</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                התחבר לחשבון שחקן ושחק במשחקים כדי להיות הראשון שכובש את ראש הטבלה!
              </p>
            </div>
          ) : (
            fullList.map((user) => (
              <div
                key={user.id}
                className={`px-6 py-4 grid grid-cols-12 gap-2 items-center text-sm transition-all ${
                  user.isCurrentUser
                    ? 'bg-amber-50/90 border-r-4 border-amber-400 font-black'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="col-span-1 text-center font-black text-slate-700">
                  #{user.rank}
                </div>

                <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                    <img src={user.avatarIcon} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 flex items-center gap-1.5">
                      <span>{getDisplayName(user.username, user.firstName, user.lastName, user.isCurrentUser, currentUser.isAdmin)}</span>
                      {user.isCurrentUser && (
                        <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full font-bold">
                          אתה
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block col-span-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#2f4d21] border border-emerald-200 inline-block">
                    {user.title}
                  </span>
                </div>

                <div className="col-span-3 sm:col-span-2 text-center font-bold text-slate-600">
                  רמה {user.level}
                </div>

                <div className="col-span-3 sm:col-span-2 text-left font-black text-[#c99719] text-base">
                  {user.points} <span className="text-xs">נק׳</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
