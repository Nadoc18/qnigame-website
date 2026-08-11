import React, { useState } from 'react';
import { UserProfile, Game, getGameThumbnailUrl, getGameThumbnailBgClass } from '../types';
import { 
  User, 
  Crown, 
  Award, 
  Star, 
  Heart, 
  Settings, 
  Flame, 
  Check, 
  Sparkles, 
  BookOpen, 
  History, 
  Edit3, 
  Save,
  Gamepad2,
  Lock,
  Volume2,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { logout, saveUserProfileToFirestore } from '../lib/firebase';
import { getLevelDetails } from '../utils/levels';
import { formatInitials } from '../utils/format';

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

interface AccountProfileProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  allGames: Game[];
  onSelectGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onOpenAuthModal?: () => void;
}

const AVATAR_OPTIONS = [
  '/avatars/shofar.jpg',
  '/avatars/torah.jpg',
  '/avatars/kippa.jpg',
  '/avatars/menorah.jpg',
  '/avatars/dreidel.jpg',
  '/avatars/rimon.jpg',
  '/avatars/tzedakah.jpg',
  '/avatars/siddur.jpg',
  '/avatars/tallit.jpg',
  '/avatars/luhot.jpg'
];

export const AccountProfile: React.FC<AccountProfileProps> = ({
  user,
  setUser,
  allGames,
  onSelectGame,
  onToggleFavorite,
  onOpenAuthModal,
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'badges' | 'history' | 'settings'>('favorites');
  const [firstNameInput, setFirstNameInput] = useState(user.firstName || '');
  const [lastNameInput, setLastNameInput] = useState(user.lastName || '');
  const [ageInput, setAgeInput] = useState<number>(user.age || 10);
  const [bioInput, setBioInput] = useState(user.bio || 'שוקד על דברי תורה וערכים בקניגיים.');
  const [isSaved, setIsSaved] = useState(false);

  const favoriteGames = allGames.filter((g) => user.favoriteGameIds.includes(g.id));

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playCorrect();
    const updatedUsername = `${firstNameInput.trim()} ${lastNameInput.trim()}`.trim() || user.username;
    
    const updatedUser: UserProfile = {
      ...user,
      firstName: firstNameInput.trim(),
      lastName: lastNameInput.trim(),
      age: Number(ageInput),
      username: updatedUsername,
      bio: bioInput,
    };

    setUser(updatedUser);
    saveUserProfileToFirestore(updatedUser);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAvatarSelect = (icon: string) => {
    soundManager.playClick();
    const updatedUser: UserProfile = {
      ...user,
      avatarIcon: icon,
    };
    setUser(updatedUser);
    saveUserProfileToFirestore(updatedUser);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Player Account Status Banner */}
      <div className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md ${
        user.isFirebaseUser 
          ? 'bg-gradient-to-r from-emerald-900/90 via-emerald-800/90 to-emerald-900/90 border-emerald-500/50 text-white' 
          : 'bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-emerald-500/10 border-amber-400/40 text-slate-800'
      }`}>
        <div className="flex items-center gap-3 text-center sm:text-right">
          <div className={`p-3 rounded-2xl ${user.isFirebaseUser ? 'bg-emerald-700/80 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="font-black text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
              <span>{user.isFirebaseUser ? 'חשבון שחקן מחובר' : 'שמור את כל ההישגים שלך בחשבון האישי'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${user.isFirebaseUser ? 'bg-emerald-400 text-slate-950' : 'bg-amber-200 text-amber-900'}`}>
                {user.isFirebaseUser ? 'מחובר' : 'אורח'}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5 font-medium">
              {user.isFirebaseUser && user.email 
                ? `מחובר בתור ${user.email} - כל הנקודות והמועדפים נשמרים בחשבונך.` 
                : 'התחבר או צור חשבון שחקן כדי לשמור את הישגיך מכל מכשיר.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            if (user.isFirebaseUser) {
              logout();
            } else if (onOpenAuthModal) {
              onOpenAuthModal();
            }
          }}
          className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 shadow ${
            user.isFirebaseUser
              ? 'bg-emerald-950/80 hover:bg-emerald-950 text-rose-300 border border-emerald-600'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white shadow-md'
          }`}
        >
          {user.isFirebaseUser ? (
            <>
              <LogOut className="w-4 h-4" />
              <span>התנתק</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>התחבר / הירשם כעת</span>
            </>
          )}
        </button>
      </div>
      
      {/* Profile Overview Card */}
      <div className="bg-gradient-to-r from-[#2f4d21] via-[#233a18] to-[#2f4d21] border-2 border-[#3e632c] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden text-white">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          
          {/* Avatar Icon */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-[#c99719] p-1 shadow-xl">
              <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={getAvatarImage(user.avatarIcon)} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#c99719] text-[#2f4d21] text-xs font-black px-2.5 py-0.5 rounded-full border border-[#2f4d21] shadow">
              רמה {user.level}
            </div>
          </div>

          {/* User Meta info */}
          <div className="flex-1 text-center sm:text-right space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{user.username}</h1>
              <span className="text-xs px-3 py-1 rounded-full bg-[#c99719]/25 border border-[#c99719]/50 text-[#f5d77f] font-extrabold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-[#c99719]" />
                {user.title}
              </span>
            </div>


            {/* Level Progress Bar */}
            {(() => {
              const levelInfo = getLevelDetails(user.points);
              return (
                <div className="space-y-1.5 pt-2 max-w-md">
                  <div className="flex justify-between text-xs text-emerald-200 font-bold">
                    <span>
                      {levelInfo.nextTarget
                        ? `התקדמות לדרגה הבאה ("${levelInfo.nextTitle}")`
                        : 'הדרגה הגבוהה ביותר 👑'}
                    </span>
                    <span className="text-yellow-400">
                      {levelInfo.nextTarget
                        ? `${user.points} / ${levelInfo.nextTarget} נק׳`
                        : `${user.points} נק׳ (מקסימום)`}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-indigo-950 rounded-full border border-indigo-800 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-500"
                      style={{ width: `${levelInfo.progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Points & Stats Pill */}
          <div className="flex sm:flex-col gap-3 shrink-0 text-center">
            <div className="bg-indigo-950/90 border border-indigo-800 px-5 py-3 rounded-2xl min-w-[110px] shadow-md">
              <div className="text-2xl font-black text-yellow-400">{user.points}</div>
              <div className="text-[11px] text-indigo-200 font-bold">סך הכל נקודות</div>
            </div>
            <div className="bg-indigo-950/90 border border-indigo-800 px-5 py-3 rounded-2xl min-w-[110px] shadow-md">
              <div className="text-2xl font-black text-emerald-400">{user.favoriteGameIds.length}</div>
              <div className="text-[11px] text-indigo-200 font-bold">משחקים מועדפים</div>
            </div>
          </div>

        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => { soundManager.playClick(); setActiveTab('favorites'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-sm transition-all border-t border-x ${
            activeTab === 'favorites'
              ? 'bg-white border-slate-200 text-indigo-700 shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>משחקים מועדפים ({favoriteGames.length})</span>
        </button>

        <button
          onClick={() => { soundManager.playClick(); setActiveTab('badges'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-sm transition-all border-t border-x ${
            activeTab === 'badges'
              ? 'bg-white border-slate-200 text-indigo-700 shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>הישגים ותגים</span>
        </button>

        <button
          onClick={() => { soundManager.playClick(); setActiveTab('history'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-sm transition-all border-t border-x ${
            activeTab === 'history'
              ? 'bg-white border-slate-200 text-indigo-700 shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-blue-600" />
          <span>שיאים והיסטוריה</span>
        </button>

        <button
          onClick={() => { soundManager.playClick(); setActiveTab('settings'); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-black text-sm transition-all border-t border-x ${
            activeTab === 'settings'
              ? 'bg-white border-slate-200 text-indigo-700 shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>הגדרות חשבון</span>
        </button>
      </div>

      {/* TAB CONTENT: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span>ספריית המועדפים האישית שלך</span>
          </h2>

          {favoriteGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteGames.map((game) => {
                const imageUrl = getGameThumbnailUrl(game);
                return (
                  <div
                    key={game.id}
                    className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-5 space-y-3 transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md"
                  >
                    <div className={`h-28 rounded-xl bg-gradient-to-br ${getGameThumbnailBgClass(game)} p-3 flex items-start justify-between relative overflow-hidden`}>
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={game.title}
                          className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-yellow-300 relative z-10">
                        {game.category}
                      </span>
                      <button
                        onClick={() => onToggleFavorite(game.id)}
                        className="p-1.5 rounded-full bg-indigo-950/70 text-rose-400 relative z-10"
                      >
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      </button>
                    </div>

                  <h3 className="font-black text-slate-900 text-base group-hover:text-indigo-600">{game.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 font-medium">{game.description}</p>

                  <button
                    onClick={() => { soundManager.playClick(); onSelectGame(game.id); }}
                    className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-xs transition-all shadow-sm"
                  >
                    הפעל משחק עכשיו
                  </button>
                </div>
              );
            })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <Heart className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">אין עדיין משחקים במועדפים</h3>
              <p className="text-xs text-slate-500 font-medium">לחץ על הלב בכרטיסי המשחקים בספריה כדי לשמור אותם כאן.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Badges */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>מדליות והישגי תורה</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border transition-all ${
                  badge.unlocked
                    ? 'bg-white border-amber-300 shadow-md'
                    : 'bg-slate-50 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    badge.unlocked
                      ? 'bg-yellow-400 text-indigo-950 shadow-md font-black'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {badge.unlocked ? '🏆' : <Lock className="w-5 h-5 text-slate-400" />}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900 text-base">{badge.title}</h3>
                      {badge.unlocked && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-extrabold">
                          הושג
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{badge.description}</p>

                    {/* Progress Bar */}
                    <div className="pt-2 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                        <span>התקדמות</span>
                        <span>{badge.progress} / {badge.maxProgress}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${Math.min(100, (badge.progress / badge.maxProgress) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>שיאים אישיים והיסטוריה</span>
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 overflow-x-auto shadow-sm">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-black">
                  <th className="pb-3">שם המשחק</th>
                  <th className="pb-3">שיא אישי</th>
                  <th className="pb-3">כמות משחקים</th>
                  <th className="pb-3">שיחק לאחרונה</th>
                  <th className="pb-3">פעולה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allGames.map((g) => {
                  const stat = user.gameStats[g.id] || { highScore: 0, playsCount: 0, lastPlayed: 'טרם נרשם' };

                  return (
                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-black text-slate-900">{g.title}</td>
                      <td className="py-3 text-amber-600 font-mono font-black">{stat.highScore} נק׳</td>
                      <td className="py-3 text-slate-700 font-medium">{stat.playsCount}</td>
                      <td className="py-3 text-xs text-slate-500 font-medium">{stat.lastPlayed}</td>
                      <td className="py-3">
                        <button
                          onClick={() => { soundManager.playClick(); onSelectGame(g.id); }}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold"
                        >
                          שחק
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl shadow-sm">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            <span>עדכון הגדרות חשבון ופרופיל</span>
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* Privacy Badge Banner */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 font-bold flex items-center justify-between gap-3 shadow-sm">
              <div>
                <span className="block text-sm font-black text-amber-950">🔒 שמירה על פרטיות</span>
                <span>השמות שלך נשמרים בבטחה. בטבלת המובילים ובתגובות למשחקים יוצגו ראשי תיבות בלבד.</span>
              </div>
              <div className="bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-black text-sm border border-amber-500 shrink-0">
                {formatInitials(user.username, firstNameInput, lastNameInput)}
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">בחר אמוג׳י/סמל לפרופיל:</label>
              <div className="flex flex-wrap gap-3">
                {AVATAR_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleAvatarSelect(icon)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border transition-all ${
                      user.avatarIcon === icon
                        ? 'border-[#2fab65] scale-110 shadow-md ring-2 ring-[#2fab65]/20'
                        : 'border-slate-200 hover:border-[#2fab65]/50 hover:scale-105'
                    }`}
                  >
                    <img src={icon} alt="Avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">שם פרטי:</label>
                <input
                  type="text"
                  value={firstNameInput}
                  onChange={(e) => setFirstNameInput(e.target.value)}
                  placeholder="למשל: אהרן"
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">שם משפחה:</label>
                <input
                  type="text"
                  value={lastNameInput}
                  onChange={(e) => setLastNameInput(e.target.value)}
                  placeholder="למשל: דוד"
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Age Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">גיל השחקן:</label>
              <input
                type="number"
                min={4}
                max={99}
                value={ageInput}
                onChange={(e) => setAgeInput(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium max-w-xs"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-sm transition-all shadow-md"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-indigo-950" />
                  <span>השינויים נשמרו בהצלחה!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>שמור שינויים</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
