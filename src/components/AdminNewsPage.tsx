import React, { useState, useEffect } from 'react';
import { NewsArticle, UserProfile } from '../types';
import { createNewsArticle, updateNewsArticle, deleteNewsArticle, setMaintenanceMode, subscribeToGlobalSettings } from '../lib/firebase';
import { Plus, Edit2, Trash2, X, Save, AlertCircle, ShieldAlert, Timer } from 'lucide-react';

interface AdminNewsPageProps {
  articles: NewsArticle[];
  user: UserProfile;
}

export const AdminNewsPage: React.FC<AdminNewsPageProps> = ({ articles, user }) => {
  const [editingArticle, setEditingArticle] = useState<Partial<NewsArticle> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<'enable' | 'disable' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalSettings((settings) => {
      setIsMaintenanceMode(settings.isMaintenanceMode || false);
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
      if (editingArticle.id) {
        await updateNewsArticle(editingArticle.id, editingArticle);
      } else {
        await createNewsArticle(editingArticle);
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
            onClick={() => setEditingArticle({
              title: '', excerpt: '', content: '', date: new Date().toLocaleDateString('he-IL'),
              author: user.username || 'מערכת', category: 'עדכוני משחקים', readTime: '3 דק׳', mediaType: 'image'
            })}
            className="flex items-center gap-2 bg-[#2fab65] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#258d51] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>כתבה חדשה</span>
          </button>
        </div>
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

          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <input 
              type="checkbox" 
              id="isAdminOnly" 
              checked={editingArticle.isAdminOnly || false} 
              onChange={e => setEditingArticle({...editingArticle, isAdminOnly: e.target.checked})} 
              className="w-4 h-4 text-[#2fab65] focus:ring-[#2fab65] border-gray-300 rounded"
            />
            <label htmlFor="isAdminOnly" className="text-sm font-bold text-slate-700 cursor-pointer">
              סודי (גלוי רק למנהל המערכת) 🔒
            </label>
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
      ) : (
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
      )}
    </div>
  );
};
