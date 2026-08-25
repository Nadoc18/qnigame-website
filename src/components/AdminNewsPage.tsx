import React, { useState, useEffect } from 'react';
import { NewsArticle, UserProfile, Game } from '../types';
import { createNewsArticle, updateNewsArticle, deleteNewsArticle, setMaintenanceMode, setMonetizationMode, subscribeToGlobalSettings, getAllUsers, toggleUserStatus, deleteUserAccount, adminToggleUserVipStatus, createGame, updateGame, deleteGame } from '../lib/firebase';
import { Plus, Edit2, Trash2, X, Save, AlertCircle, ShieldAlert, Timer, Gamepad2, ArrowUpDown, Clock, Users, UserCheck, UserX, UserMinus, Crown, ShieldCheck, Unlock, Star } from 'lucide-react';

const EMOJI_TO_IMAGE: Record<string, string> = {
  '🎓': '/player-icons/shofar.png',
  '✡️': '/player-icons/torah.png',
  '🕍': '/player-icons/kippa.png',
  '📜': '/player-icons/siddur.png',
  '🦁': '/player-icons/dreidel.png',
  '👑': '/player-icons/rimon.png',
  '🕎': '/player-icons/menorah.png',
  '🕯️': '/player-icons/shofar.png',
  '🍷': '/player-icons/tallit.png',
  '🍯': '/player-icons/tzedakah.png',
  '✡': '/player-icons/torah.png'
};

const getAvatarImage = (avatar: string | undefined): string => {
  if (!avatar) return '/player-icons/shofar.png';
  if (avatar.startsWith('/')) return avatar.replace('/avatars/', '/player-icons/').replace('.jpg', '.png');
  return EMOJI_TO_IMAGE[avatar] || '/player-icons/shofar.png';
};

interface AdminNewsPageProps {
  articles: NewsArticle[];
  user: UserProfile;
  allGames?: Game[];
}

export const AdminNewsPage: React.FC<AdminNewsPageProps> = ({ articles, user, allGames = [] }) => {
  const [adminTab, setAdminTab] = useState<'news' | 'games' | 'players'>('news');
  const [gameSortBy, setGameSortBy] = useState<'plays' | 'time'>('plays');
  
  const [editingArticle, setEditingArticle] = useState<Partial<NewsArticle> | null>(null);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isMonetizationEnabled, setIsMonetizationEnabled] = useState(true);
  const [confirmingAction, setConfirmingAction] = useState<'enable' | 'disable' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Players Tab State
  const [playersList, setPlayersList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<UserProfile | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState<number | null>(null);
  const [playerToToggleStatus, setPlayerToToggleStatus] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalSettings((settings) => {
      setIsMaintenanceMode(settings.isMaintenanceMode || false);
      setIsMonetizationEnabled(settings.isMonetizationEnabled !== false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      if (confirmingAction === 'enable') {
        setMaintenanceMode(true)
          .catch(err => alert("Error: " + err.message))
          .finally(() => {
            setCountdown(null);
            setConfirmingAction(null);
          });
      } else if (confirmingAction === 'disable') {
        setMaintenanceMode(false)
          .catch(err => alert("Error: " + err.message))
          .finally(() => {
            setCountdown(null);
            setConfirmingAction(null);
          });
      }
    }
    return () => clearTimeout(timer);
  }, [countdown, confirmingAction]);

  useEffect(() => {
    if (adminTab === 'players' && playersList.length === 0) {
      setIsLoadingPlayers(true);
      getAllUsers()
        .then(setPlayersList)
        .catch(() => {})
        .finally(() => setIsLoadingPlayers(false));
    }
  }, [adminTab]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deleteCountdown !== null && deleteCountdown > 0) {
      timer = setTimeout(() => setDeleteCountdown(deleteCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [deleteCountdown]);

  const handleToggleVip = async (targetUid: string, currentVip: boolean) => {
    try {
      await adminToggleUserVipStatus(targetUid, !currentVip);
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      alert("שגיאה בשינוי סטטוס VIP: " + err.message);
    }
  };

  const handleToggleUserStatus = async (uid: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus(uid, !currentStatus);
      setPlayersList(prev => prev.map(p => p.userId === uid ? { ...p, disabled: !currentStatus } : p));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleConfirmDeletePlayer = async () => {
    if (!playerToDelete || !playerToDelete.userId) return;
    try {
      await deleteUserAccount(playerToDelete.userId);
      setPlayersList(prev => prev.filter(p => p.userId !== playerToDelete.userId));
      setPlayerToDelete(null);
      setDeleteCountdown(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 font-bold">
        גישה נדחתה
      </div>
    );
  }

  const handleSave = async () => {
    if (!editingArticle?.title || !editingArticle?.content) {
      setError("חובה להזין כותרת ותוכן.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const finalArticle = { ...editingArticle };
      if ((finalArticle as any)._rawTags !== undefined) {
        finalArticle.tags = (finalArticle as any)._rawTags.split(',').map((s: string) => s.trim().replace(/^#/, '')).filter((s: string) => s !== '');
        delete (finalArticle as any)._rawTags;
      } else if (!finalArticle.tags) {
        finalArticle.tags = [];
      }

      if (finalArticle.id) {
        await updateNewsArticle(finalArticle.id, finalArticle);
      } else {
        await createNewsArticle(finalArticle);
      }
      setEditingArticle(null);
    } catch (err: any) {
      setError(err.message || "אירעה שגיאה");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק כתבה זו?")) {
      try {
        await deleteNewsArticle(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSaveGame = async () => {
    if (!editingGame?.title || !editingGame?.externalUrl || (!editingGame?.categoryId && !editingGame?.category)) {
      setError("חובה להזין כותרת, URL וקטגוריה.");
      return;
    }

    if (editingGame.externalUrl?.startsWith('http://') || editingGame.playUrl?.startsWith('http://') || editingGame.introVideoUrl?.startsWith('http://')) {
      setError("שגיאה: כל הקישורים חייבים להיות מאובטחים (https://) ולא (http://)");
      return;
    }

    setError(null);
    setIsSaving(true);
    let finalGame = { ...editingGame };
    if ((finalGame as any)._rawTags !== undefined) {
      finalGame.tags = (finalGame as any)._rawTags.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
      delete (finalGame as any)._rawTags;
    }

    try {
      if (finalGame.id) {
        await updateGame(finalGame.id, finalGame);
      } else {
        await createGame({
          ...finalGame,
          accessLevel: finalGame.accessLevel || 'FREE',
          isHtml5: finalGame.isHtml5 ?? true,
        });
      }
      setEditingGame(null);
      alert("נשמר בהצלחה! העמוד יתרענן כדי לטעון את המשחק.");
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "אירעה שגיאה");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק משחק זה? לא ניתן לשחזר פעולה זו!")) {
      try {
        await deleteGame(id);
        window.location.reload();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8" dir="rtl">
        <h1 className="text-3xl font-black text-slate-900">ניהול האתר וחדשות</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setConfirmingAction(isMaintenanceMode ? 'disable' : 'enable')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-md animate-pulse ${
              isMaintenanceMode 
                ? 'bg-amber-500 text-white hover:bg-amber-600 border-2 border-amber-300 ring-4 ring-amber-500/30'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span>{isMaintenanceMode ? '⚠️ מצב תחזוקה פעיל! (לחץ לביטול)' : 'הפעל מצב תחזוקה (נעל את האתר)'}</span>
          </button>
          
          <button
            onClick={() => setMonetizationMode(!isMonetizationEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-md ${
              !isMonetizationEnabled 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-emerald-300 ring-4 ring-emerald-500/30'
                : 'bg-slate-700 text-white hover:bg-slate-800'
            }`}
          >
            {isMonetizationEnabled ? <Crown className="w-5 h-5 text-amber-400" /> : <Unlock className="w-5 h-5" />}
            <span>{!isMonetizationEnabled ? '✅ אתר חינמי! (לחץ להפעלת מנויים)' : 'בטל חובת מנוי (חינם לכולם)'}</span>
          </button>
          {adminTab === 'news' && (
            <button
              onClick={() => setEditingArticle({
                title: '', excerpt: '', content: '', date: new Date().toLocaleDateString('he-IL'),
                author: user.username || 'מערכת', category: 'עדכוני משחקים', readTime: '3 דק׳', mediaType: 'image'
              })}
              className="flex items-center gap-2 bg-[#2fab65] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#258d51] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>כתבה חדשה</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-slate-200 mb-8" dir="rtl">
        <button
          onClick={() => setAdminTab('news')}
          className={`pb-4 px-2 font-bold text-lg flex items-center gap-2 transition-colors ${adminTab === 'news' ? 'text-amber-600 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          📰 ניהול חדשות
        </button>
        <button
          onClick={() => setAdminTab('games')}
          className={`pb-4 px-2 font-bold text-lg flex items-center gap-2 transition-colors ${adminTab === 'games' ? 'text-amber-600 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Gamepad2 className="w-5 h-5" /> סטטיסטיקות משחקים
        </button>
        <button
          onClick={() => setAdminTab('players')}
          className={`pb-4 px-2 font-bold text-lg flex items-center gap-2 transition-colors ${adminTab === 'players' ? 'text-amber-600 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Users className="w-5 h-5" /> שחקנים
        </button>
      </div>

      {/* Maintenance Confirmation Modal */}
      {confirmingAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" dir="rtl">
          <div className={`${confirmingAction === 'enable' ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500'} border-2 p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6`}>
            <div className={`flex items-center gap-4 ${confirmingAction === 'enable' ? 'text-red-600' : 'text-emerald-600'}`}>
              <ShieldAlert className="w-12 h-12" />
              <h2 className="text-3xl font-black">
                {confirmingAction === 'enable' ? 'אזהרה חמורה!' : 'פתיחת האתר!'}
              </h2>
            </div>
            
            <div className={`${confirmingAction === 'enable' ? 'text-red-900' : 'text-emerald-900'} font-bold text-lg leading-relaxed whitespace-pre-line`}>
              {confirmingAction === 'enable' 
                ? 'אתה עומד לנעול את האתר לחלוטין בפני כל השחקנים!\nרק מנהלים יוכלו להיכנס למערכת לאחר הפעלת מצב זה.' 
                : 'אתה עומד לפתוח את האתר מחדש לכלל השחקנים!\nכל האורחים יוכלו להיכנס שוב למערכת ולהנות מהמשחקים.'}
            </div>

            {countdown === null ? (
              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={() => setCountdown(10)}
                  className={`flex-1 ${confirmingAction === 'enable' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-black py-4 rounded-xl text-lg transition-all shadow-lg`}
                >
                  {confirmingAction === 'enable' ? 'כן, אני בטוח - הפעל מצב תחזוקה' : 'כן, אני בטוח - פתח את האתר'}
                </button>
                <button
                  onClick={() => setConfirmingAction(null)}
                  className="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 pt-4">
                <div className={`text-6xl font-black ${confirmingAction === 'enable' ? 'text-red-600' : 'text-emerald-600'} flex items-center justify-center gap-4 animate-pulse`}>
                  <Timer className="w-12 h-12" />
                  {countdown}
                </div>
                <p className={`${confirmingAction === 'enable' ? 'text-red-800' : 'text-emerald-800'} font-bold`}>
                  {confirmingAction === 'enable' ? 'האתר יינעל בעוד' : 'האתר ייפתח בעוד'} {countdown} שניות...
                </p>
                <button
                  onClick={() => {
                    setCountdown(null);
                    setConfirmingAction(null);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl text-lg transition-all shadow-lg"
                >
                  התחרטתי - בטל פעולה!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {editingArticle ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-8" dir="rtl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{editingArticle.id ? 'עריכת כתבה' : 'יצירת כתבה'}</h2>
            <button onClick={() => setEditingArticle(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">כותרת</label>
              <input type="text" value={editingArticle.title || ''} onChange={e => setEditingArticle({...editingArticle, title: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">מאת (מחבר)</label>
              <input type="text" value={editingArticle.author || ''} onChange={e => setEditingArticle({...editingArticle, author: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">תאריך (לדוגמה: 20 באוגוסט 2024)</label>
              <input type="text" value={editingArticle.date || ''} onChange={e => setEditingArticle({...editingArticle, date: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">קטגוריה</label>
              <select value={editingArticle.category || 'עדכוני משחקים'} onChange={e => setEditingArticle({...editingArticle, category: e.target.value as any})} className="w-full p-2 border rounded-lg bg-slate-50">
                <option value="עדכוני משחקים">עדכוני משחקים</option>
                <option value="טור השבוע">טור השבוע</option>
                <option value="הלכה וטכנולוגיה">הלכה וטכנולוגיה</option>
                <option value="אירועים ותחרויות">אירועים ותחרויות</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">תקציר (יופיע בכרטיסיה)</label>
            <textarea value={editingArticle.excerpt || ''} onChange={e => setEditingArticle({...editingArticle, excerpt: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 h-20" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">תוכן הכתבה (מלא)</label>
            <textarea value={editingArticle.content || ''} onChange={e => setEditingArticle({...editingArticle, content: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 h-40" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">האשטאגים / תגיות (מופרדים בפסיק)</label>
            <input type="text" value={(editingArticle as any)._rawTags !== undefined ? (editingArticle as any)._rawTags : (editingArticle.tags ? editingArticle.tags.join(', ') : '')} onChange={e => setEditingArticle({...editingArticle, _rawTags: e.target.value} as any)} className="w-full p-2 border rounded-lg bg-slate-50" placeholder="למידה, חדש, קניגיים" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <input 
                type="checkbox" 
                id="isAdminOnly" 
                checked={editingArticle.isAdminOnly || false} 
                onChange={e => setEditingArticle({...editingArticle, isAdminOnly: e.target.checked})} 
                className="w-4 h-4 text-slate-600 focus:ring-slate-600 border-gray-300 rounded"
              />
              <label htmlFor="isAdminOnly" className="text-sm font-bold text-slate-700 cursor-pointer">
                סודי (מנהל בלבד) 🔒
              </label>
            </div>

            <div className="flex-1 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <input 
                type="checkbox" 
                id="isFeatured" 
                checked={editingArticle.isFeatured || false} 
                onChange={e => setEditingArticle({...editingArticle, isFeatured: e.target.checked})} 
                className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label htmlFor="isFeatured" className="text-sm font-bold text-amber-800 cursor-pointer">
                הצג ב'חדשות חמות' 🔥
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">סוג מדיה</label>
              <select value={editingArticle.mediaType || 'none'} onChange={e => setEditingArticle({...editingArticle, mediaType: e.target.value as any})} className="w-full p-2 border rounded-lg bg-slate-50">
                <option value="none">ללא</option>
                <option value="image">תמונה</option>
                <option value="video">וידאו (YouTube, Vimeo, MP4)</option>
              </select>
            </div>
            {editingArticle.mediaType !== 'none' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">קישור למדיה (URL)</label>
                <input type="text" value={editingArticle.mediaUrl || ''} onChange={e => setEditingArticle({...editingArticle, mediaUrl: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 text-left" dir="ltr" placeholder="https://..." />
              </div>
            )}
          </div>
          
          {(editingArticle.mediaType === 'video') && (
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">קישור לתמונה ממוזערת (אופציונלי עבור סרטונים שאינם יוטיוב)</label>
                <input type="text" value={editingArticle.imageUrl || ''} onChange={e => setEditingArticle({...editingArticle, imageUrl: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 text-left" dir="ltr" placeholder="https://..." />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setEditingArticle(null)} className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100">ביטול</button>
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#2fab65] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#258d51] disabled:opacity-50">
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'שומר...' : 'שמור'}</span>
            </button>
          </div>
        </div>
      ) : adminTab === 'news' ? (
        <div className="grid gap-4" dir="rtl">
          {articles.map(article => (
            <div key={article.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  {article.title}
                  {article.isAdminOnly && <span title="סודי (גלוי רק למנהל)" className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">🔒 סודי</span>}
                </span>
                <span className="text-xs text-slate-500">{article.date} • {article.category}</span>
              </div>
              <div className="flex items-center gap-2" dir="ltr">
                <button onClick={() => setEditingArticle(article)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(article.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : adminTab === 'games' ? (
        <div className="space-y-6" dir="rtl">
          {editingGame ? (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-2xl mx-auto animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800">{editingGame.id ? 'עריכת משחק' : 'משחק חדש'}</h2>
                <button onClick={() => setEditingGame(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold flex items-center gap-2 border border-red-200"><AlertCircle className="w-5 h-5" />{error}</div>}
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">כותרת</label>
                    <input type="text" value={editingGame.title || ''} onChange={e => setEditingGame({...editingGame, title: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50" placeholder="שם המשחק" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">אייקון (FontAwesome)</label>
                    <input type="text" value={editingGame.iconName || ''} onChange={e => setEditingGame({...editingGame, iconName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr" placeholder="gamepad" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">יוצר / מחבר (Author)</label>
                    <input type="text" value={editingGame.author || ''} onChange={e => setEditingGame({...editingGame, author: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50" placeholder="שם היוצר (לדוגמה: Qnigame)" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">תקציר המשחק (Subtitle)</label>
                    <textarea value={editingGame.subtitle || ''} onChange={e => setEditingGame({...editingGame, subtitle: e.target.value})} rows={1} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 resize-none" placeholder="תקציר קצר שמופיע מתחת לשם המשחק" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">תיאור מלא (Description)</label>
                  <textarea value={editingGame.description || ''} onChange={e => setEditingGame({...editingGame, description: e.target.value})} rows={3} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 resize-none" placeholder="תיאור מלא של המשחק" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">רקע כרטיסייה (Thumbnail BG Class)</label>
                    <input type="text" value={editingGame.thumbnailBg || ''} onChange={e => setEditingGame({...editingGame, thumbnailBg: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr" placeholder="from-blue-500 to-purple-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">דרגת קושי</label>
                    <select value={editingGame.difficulty || 'קל'} onChange={e => setEditingGame({...editingGame, difficulty: e.target.value as any})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50">
                      <option value="לכל המשפחה">לכל המשפחה</option>
                      <option value="קל">קל</option>
                      <option value="בינוני">בינוני</option>
                      <option value="מאתגר">מאתגר</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Frame Width</label>
                    <input type="text" value={editingGame.frameWidth || ''} onChange={e => setEditingGame({...editingGame, frameWidth: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr" placeholder="100%" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Frame Height</label>
                    <input type="text" value={editingGame.frameHeight || ''} onChange={e => setEditingGame({...editingGame, frameHeight: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr" placeholder="600px" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Aspect Ratio</label>
                    <select value={editingGame.aspectRatio || '16/9'} onChange={e => setEditingGame({...editingGame, aspectRatio: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr">
                      <option value="16/9">16/9 (אופקי - מחשב)</option>
                      <option value="9/16">9/16 (אנכי - טלפון)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">קישור למשחק (External URL / Iframe URL)</label>
                  <input type="text" value={editingGame.externalUrl || ''} onChange={e => setEditingGame({...editingGame, externalUrl: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr" placeholder="/games/mon-jeu/index.html" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">קישור לתמונה ממוזערת (Thumbnail)</label>
                  <input type="text" value={editingGame.thumbnailUrl || ''} onChange={e => setEditingGame({...editingGame, thumbnailUrl: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr" placeholder="https://..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Play URL (אופציונלי)</label>
                    <input type="text" value={editingGame.playUrl || ''} onChange={e => setEditingGame({...editingGame, playUrl: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr" placeholder="/play/..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Intro Video URL (אופציונלי)</label>
                    <input type="text" value={editingGame.introVideoUrl || ''} onChange={e => setEditingGame({...editingGame, introVideoUrl: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-left" dir="ltr" placeholder="https://..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">קטגוריית לימוד</label>
                    <select multiple size={5} value={Array.isArray(editingGame.category) ? editingGame.category : (editingGame.category ? [editingGame.category as string] : [])} onChange={e => {
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      setEditingGame({...editingGame, category: options as any});
                    }} className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-sm">
                      <option value="שבת">שבת</option>
                      <option value="חגים">חגים</option>
                      <option value="פרשת שבוע">פרשת שבוע</option>
                      <option value="הלכה">הלכה</option>
                      <option value="תפילה">תפילה</option>
                      <option value="תנ״ך">תנ״ך</option>
                      <option value="מושגים">מושגים</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">החזק Ctrl/Cmd כדי לבחור כמה</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">גישה (Subscription)</label>
                    <select value={editingGame.accessLevel || 'FREE'} onChange={e => setEditingGame({...editingGame, accessLevel: e.target.value as any})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold">
                      <option value="FREE">חינם לכולם</option>
                      <option value="TIER_1">סטנדרט (TIER_1)</option>
                      <option value="TIER_2">פרימיום (TIER_2)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">סוג משחק</label>
                    <select multiple size={5} value={Array.isArray(editingGame.gameType) ? editingGame.gameType : (editingGame.gameType ? [editingGame.gameType] : [])} onChange={e => {
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      setEditingGame({...editingGame, gameType: options as any});
                    }} className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-sm">
                      <option value="trivia">טריוויה</option>
                      <option value="puzzle">פאזל / מחשבה</option>
                      <option value="action">פעולה</option>
                      <option value="arcade">ארקייד</option>
                      <option value="casual">קזואל</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">החזק Ctrl/Cmd כדי לבחור כמה</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">הגבלת גיל</label>
                    <select value={editingGame.ageRating || 'לכל המשפחה'} onChange={e => setEditingGame({...editingGame, ageRating: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50">
                      <option value="לכל המשפחה">לכל המשפחה</option>
                      <option value="6+">גילאי 6+</option>
                      <option value="9+">גילאי 9+</option>
                      <option value="12+">גילאי 12+</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">פסוק / מקור תורני (מוצג מתחת למשחק)</label>
                  <input type="text" value={editingGame.torahSource || ''} onChange={e => setEditingGame({...editingGame, torahSource: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50" placeholder="למשל: ״וְהָגִיתָ בּוֹ יוֹמָם וָלַיְלָה״ (יהושע א, ח)" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">ערך חינוכי / פירוט (מוצג מתחת לפסוק)</label>
                  <textarea value={editingGame.longDescription || ''} onChange={e => setEditingGame({...editingGame, longDescription: e.target.value})} rows={2} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 resize-none" placeholder="הסבר קצר על המקור או הערך החינוכי של המשחק" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">תגיות (מופרדות בפסיק)</label>
                  <input type="text" value={(editingGame as any)._rawTags !== undefined ? (editingGame as any)._rawTags : (editingGame.tags ? editingGame.tags.join(', ') : '')} onChange={e => setEditingGame({...editingGame, _rawTags: e.target.value} as any)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50" placeholder="תורה, שבת, ילדים" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">הוראות משחק (כל שורה = שלב)</label>
                  <textarea 
                    value={editingGame.instructions ? editingGame.instructions.join('\n') : ''} 
                    onChange={e => setEditingGame({...editingGame, instructions: e.target.value.split('\n').filter(s => s.trim() !== '')})} 
                    rows={4} 
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 resize-none leading-relaxed" 
                    placeholder="הוראה 1&#10;הוראה 2&#10;הוראה 3" 
                  />
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isComingSoon"
                      checked={editingGame.isComingSoon === true} 
                      onChange={e => setEditingGame({...editingGame, isComingSoon: e.target.checked})} 
                      className="w-5 h-5 rounded text-indigo-500 focus:ring-indigo-500 border-indigo-300"
                    />
                    <label htmlFor="isComingSoon" className="font-bold text-indigo-900 flex items-center gap-1">
                      🕒 משחק עתידי (בקרוב)
                    </label>
                  </div>
                  
                  {editingGame.isComingSoon && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-indigo-100 pt-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-700">תאריך יציאה משוער (טקסט חופשי)</label>
                        <input type="text" value={editingGame.releaseDate || ''} onChange={e => setEditingGame({...editingGame, releaseDate: e.target.value})} className="w-full p-2 border border-indigo-200 rounded-lg bg-white" placeholder="למשל: סתיו 2026, 15 באוקטובר" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-700">קישור לטריילר (YouTube, וכו')</label>
                        <input type="text" value={editingGame.trailerUrl || ''} onChange={e => setEditingGame({...editingGame, trailerUrl: e.target.value})} className="w-full p-2 border border-indigo-200 rounded-lg bg-white text-left" dir="ltr" placeholder="https://youtube.com/watch?v=..." />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-2">
                  <input 
                    type="checkbox" 
                    id="isHtml5"
                    checked={editingGame.isHtml5 !== false} 
                    onChange={e => setEditingGame({...editingGame, isHtml5: e.target.checked})} 
                    className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                  />
                  <label htmlFor="isHtml5" className="font-bold text-slate-700">זהו משחק HTML5 (מוטמע דרך Iframe)</label>
                </div>
                
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                  <input 
                    type="checkbox" 
                    id="isAdminOnlyGame"
                    checked={editingGame.isAdminOnly === true} 
                    onChange={e => setEditingGame({...editingGame, isAdminOnly: e.target.checked})} 
                    className="w-5 h-5 rounded text-slate-600 focus:ring-slate-500 border-slate-300"
                  />
                  <label htmlFor="isAdminOnlyGame" className="font-bold text-slate-700 flex items-center gap-1">
                    🔒 <span title="משחק סודי (יוצג רק למנהלים)">מוסתר / סודי (גלוי רק למנהל)</span>
                  </label>
                </div>
              </div>

                <div className="flex flex-wrap items-center gap-4 pb-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isNew" checked={editingGame.isNew === true} onChange={e => setEditingGame({...editingGame, isNew: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                    <label htmlFor="isNew" className="font-bold text-sm text-slate-700">משחק חדש (New)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isPopular" checked={editingGame.isPopular === true} onChange={e => setEditingGame({...editingGame, isPopular: e.target.checked})} className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300" />
                    <label htmlFor="isPopular" className="font-bold text-sm text-slate-700">פופולרי (Popular)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="requiresAuth" checked={editingGame.requiresAuth === true} onChange={e => setEditingGame({...editingGame, requiresAuth: e.target.checked})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                    <label htmlFor="requiresAuth" className="font-bold text-sm text-slate-700">דורש התחברות</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
                <button onClick={() => setEditingGame(null)} className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100">ביטול</button>
                <button onClick={handleSaveGame} disabled={isSaving} className="flex items-center gap-2 bg-[#2fab65] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#258d51] disabled:opacity-50">
                  <Save className="w-5 h-5" />
                  <span>{isSaving ? 'שומר...' : 'שמור משחק'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <h2 className="font-bold text-slate-700">כל המשחקים ({allGames.length})</h2>
                  <button
                    onClick={() => setEditingGame({
                      title: '', subtitle: '', description: '', longDescription: '', author: '', externalUrl: '', iconName: 'gamepad', accessLevel: 'FREE', category: ['הכל'], gameType: ['html5'], ageRating: 'לכל המשפחה', isHtml5: true, isAdminOnly: false, instructions: [], tags: [], thumbnailBg: 'from-emerald-600 to-teal-800', difficulty: 'לכל המשפחה', isNew: true, requiresAuth: true, tokenSupported: false, aspectRatio: '16/9'
                    })}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl font-black text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" /> הוסף משחק
                  </button>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setGameSortBy('plays')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${gameSortBy === 'plays' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ArrowUpDown className="w-4 h-4" /> לפי מספר כניסות
              </button>
              <button
                onClick={() => setGameSortBy('time')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${gameSortBy === 'time' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Clock className="w-4 h-4" /> לפי זמן כולל
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(allGames || [])
              .slice()
              .sort((a, b) => {
                if (gameSortBy === 'plays') return (b.playCount || 0) - (a.playCount || 0);
                return (b.totalTimePlayed || 0) - (a.totalTimePlayed || 0);
              })
              .map(game => (
              <div key={game.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-3 shadow-sm hover:border-amber-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br ${game.thumbnailBg || 'from-emerald-600 to-teal-800'}`}>
                        <i className={`fas fa-${game.iconName}`}></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight flex items-center gap-2">
                          {game.title}
                          {game.isAdminOnly && <span title="סודי (גלוי רק למנהל)" className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">🔒 סודי</span>}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-slate-500">{game.category}</span>
                          <span className="text-xs font-bold text-amber-600">{game.accessLevel || 'FREE'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingGame(game)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteGame(game.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
                  <div className="bg-blue-50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-blue-600">{(game.playCount || 0).toLocaleString()}</span>
                    <span className="text-xs font-bold text-blue-800/60 mt-1">כניסות (Plays)</span>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-purple-600">
                      {game.totalTimePlayed 
                        ? (game.totalTimePlayed > 3600 
                          ? `${(game.totalTimePlayed / 3600).toFixed(1)} ש\`` 
                          : `${Math.ceil(game.totalTimePlayed / 60)} דק׳`) 
                        : "0 דק׳"}
                    </span>
                    <span className="text-xs font-bold text-purple-800/60 mt-1">זמן כולל</span>
                  </div>
                </div>
              </div>
            ))}
            </div>
            </>
          )}
        </div>
      ) : null}

      {adminTab === 'players' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
            <h2 className="font-bold text-slate-700">ניהול שחקנים ({playersList.length})</h2>
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש משתמש..." 
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-amber-500 focus:border-amber-500 block w-full px-4 py-2 font-medium"
              />
            </div>
          </div>

          {isLoadingPlayers ? (
            <div className="text-center text-slate-500 py-12 font-bold animate-pulse">טוען נתונים...</div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">שחקן</th>
                      <th className="px-6 py-4">אימייל</th>
                      <th className="px-6 py-4 text-center">מנוי</th>
                      <th className="px-6 py-4 text-center">סטטוס</th>
                      <th className="px-6 py-4 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {playersList
                      .filter(player => {
                        if (!searchQuery) return true;
                        const term = searchQuery.toLowerCase();
                        return player.username?.toLowerCase().includes(term) || 
                               player.firstName?.toLowerCase().includes(term) || 
                               player.lastName?.toLowerCase().includes(term) ||
                               player.email?.toLowerCase().includes(term);
                      })
                      .map(player => (
                      <tr key={player.userId || player.id} className={`hover:bg-slate-50 transition-colors ${player.disabled ? 'opacity-75' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm border border-slate-200">
                              <img src={getAvatarImage(player.avatarIcon)} alt={player.username} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{player.username}</span>
                              {player.isAdmin && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">מנהל</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{player.email}</td>
                        <td className="px-6 py-4 text-center">
                          {player.isAdmin ? (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm">
                              <Star className="w-3.5 h-3.5 fill-current" /> מנהל VIP
                            </span>
                          ) : player.isVip ? (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm">
                              <Star className="w-3.5 h-3.5 fill-current" /> שחקן VIP
                            </span>
                          ) : player.subscriptionTier === 'TIER_2' ? (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 text-indigo-950 px-3 py-1 rounded-full text-xs font-black shadow-sm">
                              <Crown className="w-3.5 h-3.5" /> פרימיום 2
                            </span>
                          ) : player.subscriptionTier === 'TIER_1' ? (
                            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-300">
                              <ShieldCheck className="w-3.5 h-3.5" /> סטנדרט 1
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-medium">
                              חינמי
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {player.disabled ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                              <UserX className="w-4 h-4" /> חסום
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                              <UserCheck className="w-4 h-4" /> פעיל
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {player.userId !== user.uid && (
                              <>
                                {!player.isAdmin && (
                                  <button
                                    onClick={() => handleToggleVip(player.userId, player.isVip || false)}
                                    className={`p-2 rounded-xl transition-colors shadow-sm ${player.isVip ? 'bg-pink-100 hover:bg-pink-200 text-pink-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-400'}`}
                                    title={player.isVip ? 'בטל סטטוס VIP' : 'הפוך לשחקן VIP'}
                                  >
                                    <Star className={`w-5 h-5 ${player.isVip ? 'fill-current' : ''}`} />
                                  </button>
                                )}
                                <button
                                  onClick={() => setPlayerToToggleStatus(player)}
                                  className={`p-2 rounded-xl transition-colors shadow-sm ${player.disabled ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
                                  title={player.disabled ? 'שחרר חסימה' : 'חסום משתמש'}
                                >
                                  {player.disabled ? <UserCheck className="w-5 h-5" /> : <UserMinus className="w-5 h-5" />}
                                </button>
                                <button
                                  onClick={() => setPlayerToDelete(player)}
                                  className="p-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 transition-colors shadow-sm"
                                  title="מחק משתמש לצמיתות"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Toggle User Status Modal */}
          {playerToToggleStatus && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" dir="rtl">
              <div className="bg-white border-2 border-amber-500 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 animate-bounce-in">
                <div className="flex items-center gap-4 text-amber-600">
                  <AlertCircle className="w-10 h-10" />
                  <h2 className="text-2xl font-black">
                    {playerToToggleStatus.disabled ? 'שחרור חסימת שחקן' : 'חסימת שחקן'}
                  </h2>
                </div>
                
                <div className="text-slate-700 font-medium text-base leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {playerToToggleStatus.disabled ? (
                    <>האם אתה בטוח שברצונך לשחרר את החסימה של <strong>{playerToToggleStatus.username}</strong>? שחקן זה יוכל שוב להתחבר ולשחק.</>
                  ) : (
                    <>האם אתה בטוח שברצונך לחסום את <strong>{playerToToggleStatus.username}</strong>? פעולה זו תמנע ממנו להתחבר לאתר ולשחק.</>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={() => {
                      handleToggleUserStatus(playerToToggleStatus.userId, playerToToggleStatus.disabled || false);
                      setPlayerToToggleStatus(null);
                    }}
                    className={`flex-1 font-black py-3 rounded-xl text-lg transition-all shadow-md ${
                      playerToToggleStatus.disabled 
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    כן, אני מאשר
                  </button>
                  <button
                    onClick={() => setPlayerToToggleStatus(null)}
                    className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete User Modal */}
          {playerToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" dir="rtl">
              <div className="bg-red-50 border-2 border-red-500 p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6 animate-bounce-in">
                <div className="flex items-center gap-4 text-red-600">
                  <ShieldAlert className="w-12 h-12" />
                  <h2 className="text-3xl font-black">מחיקת משתמש לצמיתות!</h2>
                </div>
                
                <div className="text-red-900 font-bold text-lg leading-relaxed bg-white/50 p-4 rounded-xl border border-red-200">
                  אתה עומד למחוק לחלוטין את המשתמש <strong>{playerToDelete.username}</strong> ({playerToDelete.email}).<br/>
                  פעולה זו תמחק את החשבון, ההישגים והניקוד שלו מכל המערכות <strong>ולא ניתן לשחזר אותה!</strong>
                </div>

                {deleteCountdown === null ? (
                  <div className="flex items-center gap-4 pt-4">
                    <button
                      onClick={() => setDeleteCountdown(5)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl text-lg transition-all shadow-lg"
                    >
                      כן, אני בטוח
                    </button>
                    <button
                      onClick={() => setPlayerToDelete(null)}
                      className="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all"
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4 pt-4">
                    <div className="text-6xl font-black text-red-600 flex items-center justify-center gap-4 animate-pulse">
                      <Timer className="w-12 h-12" />
                      {deleteCountdown}
                    </div>
                    <p className="text-red-800 font-bold">
                      {deleteCountdown === 0 ? 'מוכן למחיקה' : `המחיקה תתאפשר בעוד ${deleteCountdown} שניות...`}
                    </p>
                    {deleteCountdown === 0 ? (
                      <button
                        onClick={handleConfirmDeletePlayer}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl text-lg transition-all shadow-lg"
                      >
                        אשר מחיקה סופית
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setDeleteCountdown(null);
                          setPlayerToDelete(null);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl text-lg transition-all shadow-lg"
                      >
                        התחרטתי - בטל פעולה!
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
