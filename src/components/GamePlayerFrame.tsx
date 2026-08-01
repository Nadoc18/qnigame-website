import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Game, GameComment, UserProfile } from '../types';
import { 
  ArrowRight, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Heart, 
  Star, 
  Volume2, 
  VolumeX, 
  Share2, 
  BookOpen, 
  Sparkles, 
  MessageSquare, 
  Send, 
  HelpCircle,
  Play,
  Award,
  Crown,
  FastForward,
  Film
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface GamePlayerFrameProps {
  game: Game;
  onBack: () => void;
  user: UserProfile;
  onToggleFavorite: (gameId: string) => void;
  onRecordScore: (gameId: string, score: number) => void;
  onSelectGame: (gameId: string) => void;
  allGames: Game[];
}

export const GamePlayerFrame: React.FC<GamePlayerFrameProps> = ({
  game,
  onBack,
  user,
  onToggleFavorite,
  onRecordScore,
  onSelectGame,
  allGames,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameState, setGameState] = useState<'splash' | 'intro_video' | 'playing'>('splash');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (gameState === 'intro_video' && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("AutoPlay failed, attempting unmuted/click play:", err);
      });
    }
  }, [gameState]);
  const [key, setKey] = useState(0); // To force iframe restart
  const [userRating, setUserRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<GameComment[]>([
    {
      id: 'c1',
      gameId: game.id,
      userName: 'יונתן ת.',
      userAvatar: '👑',
      userTitle: 'תלמיד חכם',
      rating: 5,
      content: 'משחק נפלא ומחכים! למדתי המון על הברכות והלכות השבת.',
      timestamp: 'לפני יומיים',
      likes: 14,
    },
    {
      id: 'c2',
      gameId: game.id,
      userName: 'רחל מ.',
      userAvatar: '🌟',
      userTitle: 'אשת חיל',
      rating: 5,
      content: 'הילדים שיחקו כל אחר הצהריים ונהנו מכל רגע!',
      timestamp: 'אתמול',
      likes: 8,
    }
  ]);

  const isFavorite = user.favoriteGameIds.includes(game.id);

  // Generate combined HTML srcDoc for iframe
  const combinedHtml = useMemo(() => {
    const htmlFile = game.files.find(f => f.name.endsWith('.html'))?.content || '';
    const cssFile = game.files.find(f => f.name.endsWith('.css'))?.content || '';
    const jsFile = game.files.find(f => f.name.endsWith('.js'))?.content || '';

    // WASM instantiateStreaming fallback polyfill for Unity WebGL MIME type errors
    const wasmPolyfill = `<script>
      if (window.WebAssembly && WebAssembly.instantiateStreaming) {
        const _origInstantiateStreaming = WebAssembly.instantiateStreaming;
        WebAssembly.instantiateStreaming = function(source, importObject) {
          return _origInstantiateStreaming(source, importObject).catch(function(err) {
            if (err instanceof TypeError || String(err).toLowerCase().includes('mime')) {
              return Promise.resolve(source).then(function(res) {
                return res.arrayBuffer();
              }).then(function(buf) {
                return WebAssembly.instantiate(buf, importObject);
              });
            }
            throw err;
          });
        };
      }
    </script>`;

    let processed = htmlFile;
    if (processed.includes('<head>')) {
      processed = processed.replace('<head>', `<head>${wasmPolyfill}`);
    } else {
      processed = `${wasmPolyfill}${processed}`;
    }

    if (cssFile) {
      processed = processed.replace(
        '</head>',
        `<style>${cssFile}</style></head>`
      );
    }
    if (jsFile) {
      processed = processed.replace(
        '</body>',
        `<script>${jsFile}</script></body>`
      );
    }
    return processed;
  }, [game]);

  const handleRestart = () => {
    soundManager.playClick();
    setKey(prev => prev + 1);
    setGameState('splash');
  };

  const handleFullscreenToggle = () => {
    soundManager.playClick();
    setIsFullscreen(!isFullscreen);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    soundManager.playCorrect();
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });

    const newComm: GameComment = {
      id: Date.now().toString(),
      gameId: game.id,
      userName: user.username,
      userAvatar: user.avatarIcon || '🎓',
      userTitle: user.title,
      rating: userRating,
      content: commentText.trim(),
      timestamp: 'עכשיו',
      likes: 0,
    };

    setComments([newComm, ...comments]);
    setCommentText('');
  };

  const relatedGames = allGames.filter(g => g.id !== game.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { soundManager.playClick(); onBack(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#2f4d21] text-sm font-bold transition-all border border-emerald-200 shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
              <span>חזרה לספרייה</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[#2f4d21] font-bold">
                  {game.category}
                </span>
                <span className="text-xs text-slate-500 font-medium">| {game.ageRating}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{game.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundManager.playClick(); onToggleFavorite(game.id); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border transition-all ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-[#2fab65]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{isFavorite ? 'במועדפים' : 'הוסף למועדפים'}</span>
            </button>
          </div>
        </div>

        {/* Game Player Frame Box */}
        <div className={`relative bg-[#233a18] border-4 border-[#3e632c] rounded-2xl overflow-hidden shadow-2xl transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-0 bg-[#1f3416] flex flex-col' : ''
        }`}>
          
          {/* Frame Control Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#2f4d21] border-b border-[#3e632c] shrink-0 text-white">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-[#c99719] inline-block animate-pulse"></span>
              <span className="font-extrabold text-white">מסגרת אינטראקטיבית (HTML5 Game Frame)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                title="אפס משחק"
                className="p-2 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-indigo-100 border border-indigo-600 transition-all text-xs flex items-center gap-1.5 font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5 text-yellow-300" />
                <span className="hidden sm:inline">מסך פתיחה / התחל מחדש</span>
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title="צלילי משחק"
                className="p-2 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-indigo-100 border border-indigo-600 transition-all"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-yellow-300" /> : <VolumeX className="w-3.5 h-3.5 text-indigo-300" />}
              </button>

              <button
                onClick={handleFullscreenToggle}
                title={isFullscreen ? 'צא מיוזמת מסך מלא' : 'מסך מלא'}
                className="p-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 transition-all flex items-center gap-1.5 text-xs font-black shadow-sm"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isFullscreen ? 'מזער מסך' : 'מסך מלא'}</span>
              </button>
            </div>
          </div>

          {/* Interactive HTML5 / JSON Game Frame Window with Preloader & Intro Video */}
          <div className={`relative bg-slate-950 w-full flex items-center justify-center p-2 overflow-auto ${isFullscreen ? 'flex-1 h-full p-0' : 'min-h-[450px] max-h-[85vh]'}`}>
            
            <div 
              className={`relative bg-black mx-auto overflow-hidden transition-all duration-300 ${
                isFullscreen ? 'w-full h-full' : 'rounded-2xl border border-indigo-900/60 shadow-2xl'
              }`}
              style={
                !isFullscreen
                  ? {
                      width: game.frameWidth && game.frameWidth !== '100%' ? game.frameWidth : '100%',
                      maxWidth: '100%',
                      height: game.frameHeight && game.frameHeight !== '100%' ? game.frameHeight : undefined,
                      maxHeight: '80vh',
                      aspectRatio: game.aspectRatio ? game.aspectRatio.replace('/', ' / ') : undefined,
                      minHeight: (!game.frameHeight || game.frameHeight === '100%') && !game.aspectRatio ? '550px' : undefined
                    }
                  : undefined
              }
            >

              {/* 1. Pure Black Cover Screen Overlay with ONLY the Hebrew שחק Button */}
              {gameState === 'splash' && (
                <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center p-6 text-center text-white">
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setGameState('intro_video');
                    }}
                    className="group relative inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-[#c99719] via-[#e5af24] to-[#c99719] text-[#2f4d21] font-black text-2xl sm:text-3xl shadow-[0_0_40px_rgba(245,215,127,0.6)] hover:scale-105 hover:shadow-[0_0_60px_rgba(245,215,127,0.9)] transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-9 h-9 fill-[#2f4d21]" />
                    <span>שחק</span>
                  </button>
                </div>
              )}

              {/* 2. Mandatory Intro Video Player Overlay */}
              {gameState === 'intro_video' && (
                <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef}
                    src={game.introVideoUrl || 'https://firebasestorage.googleapis.com/v0/b/molten-protocol-whnbb.firebasestorage.app/o/intro_squareHEBREW.mp4?alt=media&token=a80d8520-1de6-46a4-a8b9-df2103855845'}
                    autoPlay
                    playsInline
                    controls={false}
                    onEnded={() => setGameState('playing')}
                    onError={(e) => {
                      console.error("Erreur de lecture vidéo (Vérifiez les accès du fichier Firebase Storage):", e);
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 3. The Actual Preloaded Game Iframe (Running continuously underneath!) */}
              <iframe
                key={key}
                title={game.title}
                src={(game.externalUrl || game.playUrl) ? (game.externalUrl || game.playUrl) : undefined}
                srcDoc={(!game.externalUrl && !game.playUrl && combinedHtml.trim()) ? combinedHtml : undefined}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
              />

            </div>
          </div>

          {/* Frame Footer Bar */}
          <div className="px-4 py-2.5 bg-indigo-950 border-t border-indigo-900 flex items-center justify-between text-xs text-indigo-200 shrink-0 font-medium">
            <div className="flex items-center gap-4">
              <span>יוצר: <strong className="text-yellow-300 font-bold">{game.author}</strong></span>
              <span>דרגה: <strong className="text-white font-bold">{game.difficulty}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-yellow-300 font-black">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{game.rating} ({game.ratingCount} דירוגים)</span>
            </div>
          </div>
        </div>

        {/* Instructions & Torah Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Instructions */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-indigo-700 font-black text-lg">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h3>הוראות משחק ומקשים</h3>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed font-medium">
              {game.instructions.map((inst, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs flex items-center justify-center shrink-0 font-mono font-black">
                    {idx + 1}
                  </span>
                  <span>{inst}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Torah Source */}
          <div className="bg-gradient-to-br from-indigo-50/80 to-yellow-50/50 border border-indigo-100 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-indigo-900 font-black text-lg">
              <BookOpen className="w-5 h-5 text-indigo-700" />
              <h3>מקורות וערך חינוכי</h3>
            </div>
            <p className="text-sm text-indigo-950 font-bold italic leading-relaxed bg-white/80 p-4 rounded-xl border border-indigo-100 shadow-sm">
              {game.torahSource}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {game.longDescription}
            </p>
          </div>

        </div>

        {/* Comments & Reviews Section */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3 text-slate-900 font-black text-xl">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h3>תגובות וחוויות מהמשחק</h3>
            </div>
            <span className="text-xs text-slate-500 font-bold">{comments.length} תגובות</span>
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">הוסף תגובה ודירוג:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-5 h-5 ${star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="כתוב תגובה, טיפ למשחק או מילה טובה..."
              rows={2}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-sm transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>פרסם תגובה</span>
              </button>
            </div>
          </form>

          {/* Comment List */}
          <div className="space-y-4">
            {comments.map((comm) => (
              <div key={comm.id} className="bg-slate-50/80 border border-slate-200 p-4 rounded-xl flex gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xl shrink-0 shadow-inner">
                  {comm.userAvatar}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{comm.userName}</span>
                      <span className="text-[10px] bg-indigo-100 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                        {comm.userTitle}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{comm.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[...Array(comm.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed mt-1 font-medium">{comm.content}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Related Games */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>משחקים נוספים שאולי תאהב</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedGames.map((relGame) => (
              <div
                key={relGame.id}
                onClick={() => { soundManager.playClick(); onSelectGame(relGame.id); }}
                className="bg-white border border-slate-200 hover:border-indigo-400 p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md"
              >
                <div className={`h-24 rounded-xl bg-gradient-to-br ${relGame.thumbnailBg} flex items-center justify-center mb-3 shadow-inner`}>
                  <Play className="w-8 h-8 text-white group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-xs text-indigo-600 font-bold mb-1">{relGame.category}</div>
                <h4 className="font-black text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600">{relGame.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">{relGame.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
