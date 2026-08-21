import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Game, GameComment, UserProfile, getGameThumbnailUrl, getGameThumbnailBgClass } from '../types';
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
  Film,
  Trophy,
  Lock,
  Trash2
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { getDisplayName } from '../utils/format';
import { generateGameSessionToken } from '../utils/gameTokenService';
import { getBadgesForGame } from '../utils/BadgeEngine';

import { 
  subscribeToGameComments, 
  addGameCommentToFirestore, 
  likeGameCommentInFirestore,
  incrementGameStats,
  subscribeToGameLeaderboard,
  LeaderboardEntry,
  getGameGlobalData,
  updateGameGlobalData,
  getGameProgressFromFirestore,
  deleteGameCommentFromFirestore
} from '../lib/firebase';

interface GamePlayerFrameProps {
  game: Game;
  onBack: () => void;
  user: UserProfile;
  onToggleFavorite: (gameId: string) => void;
  onRecordScore?: (gameId: string, pointsToAdd?: number, newHighScoreAttempt?: number) => void;
  onSaveGameProgress?: (gameId: string, progressData: any) => void;
  onSelectGame: (gameId: string) => void;
  allGames: Game[];
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

export const GamePlayerFrame: React.FC<GamePlayerFrameProps> = ({
  game,
  onBack,
  user,
  onToggleFavorite,
  onRecordScore,
  onSaveGameProgress,
  onSelectGame,
  allGames,
  onOpenAuthModal,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('qnigame_sound_enabled');
    return saved ? saved === 'true' : true;
  });
  const [gameState, setGameState] = useState<'splash' | 'intro_video' | 'playing'>('splash');
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0); // To force iframe restart
  
  const gameStateRef = useRef(gameState);
  const pendingMessagesRef = useRef<{type: string, source: WindowProxy, data: any}[]>([]);

  useEffect(() => {
    gameStateRef.current = gameState;
    // Process pending messages when game starts playing
    if (gameState === 'playing' && pendingMessagesRef.current.length > 0) {
      const messagesToProcess = [...pendingMessagesRef.current];
      pendingMessagesRef.current = [];
      
      messagesToProcess.forEach(msg => {
        // We simulate a message event to re-trigger the logic, preserving the source window
        const event = new MessageEvent('message', {
          data: msg.data,
          source: msg.source,
        });
        window.dispatchEvent(event);
      });
    }
  }, [gameState]);

  // Sync sound setting to localStorage and iframe
  useEffect(() => {
    localStorage.setItem('qnigame_sound_enabled', String(soundEnabled));
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'QNIGAME_SET_SOUND',
        enabled: soundEnabled
      }, '*');
    }
  }, [soundEnabled]);

  const gameBadges = useMemo(() => getBadgesForGame(game, user.badges), [game, user.badges]);

  // iOS orientation detection
  const isIOS = useMemo(() => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)), []);
  const [isPortrait, setIsPortrait] = useState(false);
  useEffect(() => {
    const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Track gameplay duration and global stats
  const playStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let hasCountedPlay = false;

    if (gameState === 'playing') {
      playStartTimeRef.current = Date.now();

      interval = setInterval(() => {
        if (playStartTimeRef.current) {
          const now = Date.now();
          const duration = Math.floor((now - playStartTimeRef.current) / 1000);
          if (duration > 0) {
            const playInc = !hasCountedPlay && duration >= 5 ? 1 : 0;
            if (playInc > 0) hasCountedPlay = true;
            
            incrementGameStats(game.id, playInc, duration);
            playStartTimeRef.current = now;
          }
        }
      }, 15000);
    } else {
      // If we transition out of 'playing', save the time immediately
      if (playStartTimeRef.current) {
        const playDurationSeconds = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
        if (playDurationSeconds > 0) {
          const playInc = !hasCountedPlay && playDurationSeconds >= 5 ? 1 : 0;
          if (playInc > 0) hasCountedPlay = true;
          incrementGameStats(game.id, playInc, playDurationSeconds);
        }
        playStartTimeRef.current = null;
      }
    }
    
    // Emergency save if the user closes the tab or refreshes (F5)
    const handleBeforeUnload = () => {
      if (playStartTimeRef.current) {
        const playDurationSeconds = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
        if (playDurationSeconds > 0) {
          const playInc = !hasCountedPlay && playDurationSeconds >= 5 ? 1 : 0;
          incrementGameStats(game.id, playInc, playDurationSeconds);
        }
        playStartTimeRef.current = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Save on normal unmount
      if (playStartTimeRef.current) {
        const playDurationSeconds = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
        if (playDurationSeconds > 0) {
          const playInc = !hasCountedPlay && playDurationSeconds >= 5 ? 1 : 0;
          if (playInc > 0) hasCountedPlay = true;
          incrementGameStats(game.id, playInc, playDurationSeconds);
        }
        playStartTimeRef.current = null;
      }
    };
  }, [gameState, game.id]);

  // Generate temporary session token for authenticated user
  const gameToken = useMemo(() => {
    if (user.isFirebaseUser) {
      return generateGameSessionToken(user.id, game.id);
    }
    return null;
  }, [user.id, user.isFirebaseUser, game.id, key]);

  // Compute target iframe src URL with token parameters
  const iframeSrc = useMemo(() => {
    const rawUrl = game.externalUrl || game.playUrl;
    if (!rawUrl) return undefined;
    if (gameToken) {
      const sep = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${sep}token=${encodeURIComponent(gameToken)}&userId=${encodeURIComponent(user.id)}&gameId=${encodeURIComponent(game.id)}`;
    }
    return rawUrl;
  }, [game.externalUrl, game.playUrl, gameToken, user.id, game.id]);

  // PostMessage listener for token verification, live points sync, and JSON game progress save per gameId
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // Force use of the platform's game.id to avoid mismatches if the game hardcodes a different ID in its payload
      const targetGameId = game.id;
      const targetWin = event.source as WindowProxy;

      if (data.type === 'QNIGAME_VERIFY_TOKEN') {
        if (gameStateRef.current !== 'playing') {
          pendingMessagesRef.current.push({ type: 'QNIGAME_VERIFY_TOKEN', source: targetWin, data: data });
          return;
        }
        if (targetWin && targetWin.postMessage) {
          const verifyAsync = async () => {
            let currentSave = user.gameProgress?.[targetGameId] || null;
            if (!currentSave && user.id && !user.id.startsWith('guest')) {
               try {
                  const fsSave = await getGameProgressFromFirestore(user.id, targetGameId);
                  if (fsSave) {
                     currentSave = fsSave;
                  }
               } catch (e) {
                  console.error("Failed to load progress from firestore", e);
               }
            }
            if (typeof currentSave === 'string') {
              try { currentSave = JSON.parse(currentSave); } catch(e) {}
            }

            // Standard QNIGAME_AUTH_CONFIRMED response with generic progress object
            targetWin.postMessage({
              type: 'QNIGAME_AUTH_CONFIRMED',
              user: {
                id: user.id,
                username: user.username,
                level: user.level,
                points: user.gameStats?.[targetGameId]?.highScore || 0,
              },
              progress: currentSave,
              gameId: targetGameId,
              soundEnabled: soundEnabled, // Initial sound state
            }, '*');

            // Backward-compatibility QNIGAME_TOKEN_VERIFIED response
            targetWin.postMessage({
              type: 'QNIGAME_TOKEN_VERIFIED',
              success: true,
              gameId: targetGameId,
              user: {
                id: user.id,
                username: user.username,
                level: user.level,
                points: user.gameStats?.[targetGameId]?.highScore || 0,
              },
              progress: currentSave,
              gameProgress: currentSave,
              soundEnabled: soundEnabled,
            }, '*');
          };
          verifyAsync();
        }
      } else if (data.type === 'QNIGAME_LOAD_PROGRESS') {
        if (gameStateRef.current !== 'playing') {
          pendingMessagesRef.current.push({ type: 'QNIGAME_LOAD_PROGRESS', source: targetWin, data: data });
          return;
        }
        if (targetWin && targetWin.postMessage) {
          const loadAsync = async () => {
            let currentSave = user.gameProgress?.[targetGameId] || null;
            if (!currentSave && user.id && !user.id.startsWith('guest')) {
               try {
                  const fsSave = await getGameProgressFromFirestore(user.id, targetGameId);
                  if (fsSave) currentSave = fsSave;
               } catch (e) {}
            }
            if (typeof currentSave === 'string') {
              try { currentSave = JSON.parse(currentSave); } catch(e) {}
            }
            targetWin.postMessage({
              type: 'QNIGAME_PROGRESS_LOADED',
              success: true,
              gameId: targetGameId,
              progress: currentSave,
            }, '*');
          };
          loadAsync();
        }
      } else if (data.type === 'QNIGAME_UPDATE_SCORE') {
        let pointsToAdd = 0;
        let highScore = 0;
        
        if (data.pointsToAdd !== undefined) pointsToAdd = Number(data.pointsToAdd);
        if (data.highScore !== undefined) highScore = Number(data.highScore);
        
        // Backwards compatibility for older games sending just {score: 10}
        if (data.pointsToAdd === undefined && data.highScore === undefined && data.score !== undefined) {
          pointsToAdd = Number(data.score); // Default: legacy score adds points
        }

        if (onRecordScore && (pointsToAdd > 0 || highScore > 0)) {
          onRecordScore(targetGameId, pointsToAdd, highScore);
        }
      } else if (data.type === 'QNIGAME_SAVE_PROGRESS') {
        const rawProgress = data.progressData !== undefined ? data.progressData : data.progress;
        if (rawProgress !== undefined && onSaveGameProgress) {
          onSaveGameProgress(targetGameId, rawProgress);
          if (targetWin && targetWin.postMessage) {
            targetWin.postMessage({
              type: 'QNIGAME_PROGRESS_SAVED',
              success: true,
              gameId: targetGameId,
              savedAt: new Date().toISOString()
            }, '*');
          }
        }
      } else if (data.type === 'QNIGAME_LOAD_GLOBAL_DATA') {
        if (gameStateRef.current !== 'playing') {
          pendingMessagesRef.current.push({ type: 'QNIGAME_LOAD_GLOBAL_DATA', source: targetWin, data: data });
          return;
        }
        if (targetWin && targetWin.postMessage) {
          getGameGlobalData(targetGameId).then((globalData) => {
            targetWin.postMessage({
              type: 'QNIGAME_GLOBAL_DATA_LOADED',
              success: true,
              gameId: targetGameId,
              data: globalData
            }, '*');
          }).catch(() => {});
        }
      } else if (data.type === 'QNIGAME_SAVE_GLOBAL_DATA') {
        if (data.data !== undefined) {
          updateGameGlobalData(targetGameId, data.data).then(() => {
            if (targetWin && targetWin.postMessage) {
              targetWin.postMessage({
                type: 'QNIGAME_GLOBAL_DATA_SAVED',
                success: true,
                gameId: targetGameId
              }, '*');
            }
          }).catch(() => {});
        }
      } else if (data.type === 'QNIGAME_TOGGLE_SOUND') {
        if (data.enabled !== undefined) {
          setSoundEnabled(Boolean(data.enabled));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, game.id, onRecordScore, onSaveGameProgress, soundEnabled]);


  const [userRating, setUserRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [gameLeaderboard, setGameLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [comments, setComments] = useState<GameComment[]>([]);

  // Sound effects
  const playClick = () => soundManager.playClick();

  // Subscribe to live Firestore comments for current game
  useEffect(() => {
    const unsubComments = subscribeToGameComments(game.id, (comms) => {
      if (comms) {
        setComments(comms);
      }
    });

    const unsubLeaderboard = subscribeToGameLeaderboard(game.id, (entries) => {
      setGameLeaderboard(entries);
    }, 0); // fetch all for local ranking

    return () => {
      unsubComments();
      unsubLeaderboard();
    };
  }, [game.id]);

  // Calculate dynamic rating from database comments
  const dynamicRatingCount = comments.length;
  const dynamicRating = comments.length > 0
    ? (comments.reduce((sum, c) => sum + c.rating, 0) / comments.length).toFixed(1)
    : "0.0";

  const isFavorite = user.favoriteGameIds.includes(game.id);

  // Generate combined HTML srcDoc for iframe
  const combinedHtml = useMemo(() => {
    const htmlFile = (game.files || []).find(f => f.name.endsWith('.html'))?.content || '';
    const cssFile = (game.files || []).find(f => f.name.endsWith('.css'))?.content || '';
    const jsFile = (game.files || []).find(f => f.name.endsWith('.js'))?.content || '';

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

  const frameBoxRef = useRef<HTMLDivElement>(null);

  // Dynamic Aspect Ratio calculation strictly based on game.aspectRatio from JSON / data
  const rawRatio = (game.aspectRatio || '').trim().replace(/\s+/g, '');
  const isLandscapeGame = rawRatio === '16/9' || rawRatio === '16:9' || rawRatio === '4/3' || rawRatio === '4:3';
  const formattedRatio = rawRatio
    ? rawRatio.replace('/', ' / ').replace(':', ' / ')
    : (game.frameWidth === '100%' ? '16 / 9' : '9 / 16');
    
  const ratioValue = rawRatio && rawRatio.includes(':') 
    ? parseFloat(rawRatio.split(':')[0]) / parseFloat(rawRatio.split(':')[1])
    : rawRatio && rawRatio.includes('/')
      ? parseFloat(rawRatio.split('/')[0]) / parseFloat(rawRatio.split('/')[1])
      : (game.frameWidth === '100%' ? 16/9 : 9/16);

  // Mobile Screen Orientation Lock / Unlock helpers for 16/9 Landscape games
  const lockLandscapeOrientation = async () => {
    try {
      if ((screen.orientation as any)?.lock) {
        await (screen.orientation as any).lock('landscape');
      } else if ((screen as any).lockOrientation) {
        (screen as any).lockOrientation('landscape');
      }
    } catch (err) {
      console.warn('Screen orientation lock not supported on this device/browser:', err);
    }
  };

  const unlockOrientation = () => {
    try {
      if ((screen.orientation as any)?.unlock) {
        (screen.orientation as any).unlock();
      } else if ((screen as any).unlockOrientation) {
        (screen as any).unlockOrientation();
      }
    } catch (err) {}
  };

  const handleFullscreenToggle = () => {
    soundManager.playClick();
    if (!isFullscreen) {
      if (frameBoxRef.current?.requestFullscreen) {
        frameBoxRef.current.requestFullscreen().catch((err) => console.warn(err));
      } else if ((frameBoxRef.current as any)?.webkitRequestFullscreen) {
        (frameBoxRef.current as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      if (isLandscapeGame) {
        lockLandscapeOrientation();
      }
    } else {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch((err) => console.warn(err));
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }
      setIsFullscreen(false);
      unlockOrientation();
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        unlockOrientation();
      } else if (isLandscapeGame) {
        lockLandscapeOrientation();
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      unlockOrientation();
    };
  }, [isLandscapeGame]);

  // Lock body scroll when pseudo-fullscreen is active (critical for iOS)
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      // Also scroll to top to hide Safari address bar where possible
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user.isFirebaseUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    soundManager.playCorrect();
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });

    const newCommData = {
      gameId: game.id,
      userId: user.id,
      userName: user.username || user.email?.split('@')[0] || 'שחקן',
      userAvatar: user.avatarIcon || '/avatars/shofar.png',
      userTitle: user.title || 'לומד תורה',
      rating: userRating,
      content: commentText.trim(),
      timestamp: 'עכשיו',
      likes: 0,
    };

    setCommentText('');

    try {
      await addGameCommentToFirestore(newCommData);
    } catch (err) {
      // silent
    }
  };

  const handleLikeComment = (comm: GameComment) => {
    if (!user.isFirebaseUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    
    const hasLiked = comm.likedBy && comm.likedBy.includes(user.id);
    const isLiking = !hasLiked;
    
    soundManager.playClick();
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === comm.id) {
          if (isLiking) {
            return { ...c, likes: c.likes + 1, likedBy: [...(c.likedBy || []), user.id] };
          } else {
            return { ...c, likes: Math.max(0, c.likes - 1), likedBy: (c.likedBy || []).filter(id => id !== user.id) };
          }
        }
        return c;
      })
    );
    likeGameCommentInFirestore(comm.id, user.id, isLiking);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תגובה זו?')) {
      try {
        await deleteGameCommentFromFirestore(commentId);
      } catch (err) {
        console.error("Error deleting comment:", err);
        alert('אירעה שגיאה במחיקת התגובה. אנא נסה שוב.');
      }
    }
  };

  // Leaderboard specific logic
  const { top10Leaderboard, userRankEntry } = useMemo(() => {
    const top10Leaderboard = gameLeaderboard.slice(0, 10);
    const userIndex = gameLeaderboard.findIndex(entry => entry.id === user.id);
    let userRankEntry = null;
    if (userIndex >= 10) {
      userRankEntry = {
        ...gameLeaderboard[userIndex],
        rank: userIndex + 1
      };
    }
    return { top10Leaderboard, userRankEntry };
  }, [gameLeaderboard, user.id]);

  const displayedComments = useMemo(() => {
    // Sort comments so user's comments are always first, then by date (newest first)
    const sorted = [...comments].sort((a, b) => {
      const isUserA = a.userId === user.id;
      const isUserB = b.userId === user.id;
      if (isUserA && !isUserB) return -1;
      if (!isUserA && isUserB) return 1;
      
      // Sort by timestamp desc
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    return sorted.slice(0, 20);
  }, [comments, user.id]);

  const relatedGames = allGames.filter(g => g.id !== game.id).slice(0, 3);

  const handleIframeLoad = async () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    // Auto-push the progress to the game just in case the game forgot to ask for it
    const targetWin = iframeRef.current.contentWindow;
    const targetGameId = game.id;
    let currentSave = user.gameProgress?.[targetGameId] || null;

    if (!currentSave && user.id && !user.id.startsWith('guest')) {
       try {
          const fsSave = await getGameProgressFromFirestore(user.id, targetGameId);
          if (fsSave) {
             currentSave = fsSave;
          }
       } catch (e) {
          console.error("Failed to load progress from firestore on load", e);
       }
    }
    if (typeof currentSave === 'string') {
      try { currentSave = JSON.parse(currentSave); } catch(e) {}
    }

    targetWin.postMessage({
      type: 'QNIGAME_TOKEN_VERIFIED',
      success: true,
      gameId: targetGameId,
      user: {
        id: user.id,
        username: user.username,
        level: user.level,
        points: user.gameStats?.[targetGameId]?.highScore || 0,
      },
      progress: currentSave,
      gameProgress: currentSave,
    }, '*');
  };

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

          <div className="flex items-center gap-3">
            {getGameThumbnailUrl(game) && (
              <div className="flex w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-0.5 shadow-md border border-slate-200 shrink-0 relative sm:hover:scale-[2.5] sm:hover:z-50 sm:origin-top-left transition-all duration-300 ease-out cursor-pointer hover:shadow-2xl">
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-white">
                  <img 
                    src={getGameThumbnailUrl(game)} 
                    alt={game.title} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={() => { soundManager.playClick(); onToggleFavorite(game.id); }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-[#2fab65] hover:bg-slate-100 shadow-sm'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{isFavorite ? 'במועדפים' : 'הוסף למועדפים'}</span>
            </button>
          </div>
        </div>

        <div 
          ref={frameBoxRef}
          className={
            isFullscreen 
              ? 'fixed inset-0 z-[99999] bg-black flex items-center justify-center m-0 p-0'
              : 'relative bg-[#233a18] border-4 border-[#3e632c] rounded-2xl overflow-hidden shadow-2xl transition-all'
          }
        >
          
          {/* Floating Minimize Button in Fullscreen Mode */}
          {isFullscreen && (
            <button
              onClick={handleFullscreenToggle}
              title="צא ממסך מלא"
              className={`absolute top-4 ${isIOS && isPortrait && isLandscapeGame ? 'right-4' : 'left-4'} z-50 px-4 py-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 transition-all flex items-center gap-2 text-xs font-black shadow-2xl cursor-pointer border border-yellow-300/60`}
            >
              <Minimize2 className="w-4 h-4" />
              <span>מזער מסך</span>
            </button>
          )}

          {/* Standard Frame Control Bar (Hidden in Fullscreen) */}
          {!isFullscreen && (
            <div className="flex items-center justify-between px-4 py-3 bg-[#2f4d21] border-b border-[#3e632c] shrink-0 text-white z-40">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c99719] inline-block animate-pulse shrink-0"></span>
                <div className="flex flex-col gap-0.5 leading-tight">
                  <span className="font-black text-[#c99719] sm:text-sm">חווית המשחק טובה יותר במחשב</span>
                  <span className="text-white/90 font-medium text-[10px] sm:text-xs">בפעם הראשונה, טעינת המשחק עשויה לקחת מעט יותר זמן מהרגיל.</span>
                </div>
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
                  title="מסך מלא"
                  className="px-3.5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-indigo-950 transition-all flex items-center gap-2 text-xs font-black shadow-md cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>מסך מלא</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive HTML5 / JSON Game Frame Window with Preloader & Intro Video */}
          <div className={
            isFullscreen 
              ? 'w-full h-full p-0 m-0 bg-black flex items-center justify-center overflow-hidden'
              : 'relative bg-black w-full min-h-[450px] max-h-[85vh] p-2 flex items-center justify-center overflow-hidden'
          }>
            
            <div 
              className={
                isFullscreen 
                  ? 'w-full h-full flex items-center justify-center shadow-2xl bg-black overflow-hidden'
                  : 'relative bg-black mx-auto overflow-hidden transition-all duration-300 rounded-2xl border border-indigo-900/60 shadow-2xl'
              }
              style={
                !isFullscreen
                  ? (isLandscapeGame
                      ? {
                          width: '100%',
                          maxWidth: `calc(80vh * (${formattedRatio}))`,
                          aspectRatio: formattedRatio,
                          maxHeight: '80vh',
                          margin: '0 auto',
                        }
                      : {
                          width: game.frameWidth && game.frameWidth !== '100%' ? game.frameWidth : '375px',
                          maxWidth: '100%',
                          height: game.frameHeight && game.frameHeight !== '100%' ? game.frameHeight : undefined,
                          maxHeight: '80vh',
                          aspectRatio: formattedRatio,
                          minHeight: (!game.frameHeight || game.frameHeight === '100%') && !game.aspectRatio ? '550px' : undefined
                        })
                  : (isLandscapeGame
                      ? (isIOS && isPortrait ? {
                          width: `min(100vh, 100vw * ${ratioValue})`,
                          height: `min(100vw, 100vh / ${ratioValue})`,
                          aspectRatio: formattedRatio,
                          transform: 'rotate(90deg)',
                          transformOrigin: 'center center',
                          flexShrink: 0,
                        } : {
                          width: `min(100vw, 100vh * ${ratioValue})`,
                          height: `min(100vh, 100vw / ${ratioValue})`,
                          aspectRatio: formattedRatio,
                        })
                      : {
                          width: `min(100vw, 100vh * ${ratioValue})`,
                          height: `min(100vh, 100vw / ${ratioValue})`,
                          aspectRatio: formattedRatio,
                        })
              }
            >

              {/* 1. Cover Screen Overlay with Optional Background Photo & ONLY the Hebrew שחק Button */}
              {gameState === 'splash' && (
                <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden">
                  {getGameThumbnailUrl(game) && (
                    <>
                      <img
                        src={getGameThumbnailUrl(game)}
                        alt={game.title}
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/70 z-0" />
                    </>
                  )}
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      const isIOS = typeof window !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
                      
                      if (isIOS) {
                        setGameState('playing');
                      } else {
                        if (videoRef.current) {
                          videoRef.current.muted = false;
                          videoRef.current.play().catch(() => {});
                        }
                        setGameState('intro_video');
                      }
                    }}
                    className="group relative z-10 inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-[#c99719] via-[#e5af24] to-[#c99719] text-[#2f4d21] font-black text-2xl sm:text-3xl shadow-[0_0_40px_rgba(245,215,127,0.6)] hover:scale-105 hover:shadow-[0_0_60px_rgba(245,215,127,0.9)] transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-9 h-9 fill-[#2f4d21]" />
                    <span>שחק</span>
                  </button>
                </div>
              )}

              {/* 2. Mandatory Intro Video Player Overlay (Always mounted during splash for iOS synchronous play) */}
              {gameState !== 'playing' && (
                <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef}
                    src={game.introVideoUrl || 'https://firebasestorage.googleapis.com/v0/b/molten-protocol-whnbb.firebasestorage.app/o/intro_squareHEBREW.mp4?alt=media&token=a80d8520-1de6-46a4-a8b9-df2103855845'}
                    playsInline
                    preload="auto"
                    muted
                    controls={false}
                    onEnded={() => setGameState('playing')}
                    onError={(e) => {
                      // silent
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 3. Authentication Gate Overlay for Games Requiring an Account */}
              {game.requiresAuth && !user.isFirebaseUser && (
                <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-4 border-2 border-amber-500/40 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 text-3xl shadow-lg animate-bounce">
                    🔑
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="text-2xl font-black text-amber-400">כניסה למשחק מותנית בהתחברות לחשבון</h3>
                    <p className="text-sm text-slate-300">
                      כדי לשחק במשחק זה, לאמת אסימון כניסה, לשמור את התקדמות השלבים שלך ולצבור נקודות לחשבון, יש להתחבר לחשבון קניגיים.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenAuthModal && onOpenAuthModal()}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>התחבר לחשבון עכשיו</span>
                  </button>
                </div>
              )}

              {/* 4. The Actual Preloaded Game Iframe */}
              <iframe
                ref={iframeRef}
                key={key}
                title={game.title}
                src={iframeSrc}
                srcDoc={(!game.externalUrl && !game.playUrl && combinedHtml.trim()) ? combinedHtml : undefined}
                className="w-full h-full border-none"
                style={{ overflow: 'hidden' }}
                scrolling="no"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onLoad={handleIframeLoad}
                allow="autoplay; fullscreen"
              />

            </div>
          </div>

          {/* Frame Footer Bar */}
          {!isFullscreen && (
            <div className="px-4 py-2.5 bg-indigo-950 border-t border-indigo-900 flex items-center justify-between text-xs text-indigo-200 shrink-0 font-medium">
              <div className="flex items-center gap-4">
                <span>יוצר: <strong className="text-yellow-300 font-bold">{game.author}</strong></span>
                <span>דרגה: <strong className="text-white font-bold">{game.difficulty}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-yellow-300 font-black">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span>{dynamicRating} ({dynamicRatingCount} דירוגים)</span>
              </div>
            </div>
          )}
        </div>

        {!isFullscreen && (
          <>

        {/* Instructions & Torah Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Instructions */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-indigo-700 font-black text-lg">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h3>הוראות משחק ומקשים</h3>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed font-medium">
              {(game.instructions || []).map((inst, idx) => (
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

          {/* Discreet Game Leaderboard */}
          <div className="bg-slate-50/80 border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-black text-sm mb-2 border-b border-slate-200 pb-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3>המובילים במשחק זה</h3>
            </div>
            
            {gameLeaderboard.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {top10Leaderboard.map((entry, idx) => (
                  <div key={entry.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border shadow-sm text-xs transition-colors group ${entry.id === user.id ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-black text-slate-400 w-3">{idx + 1}.</span>
                      <img src={getAvatarImage(entry.avatarIcon)} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-slate-700 truncate group-hover:text-amber-700 transition-colors">
                          {getDisplayName(entry.username, entry.firstName, entry.lastName, entry.id === user.id, user.isAdmin)}
                        </span>
                        {entry.id === user.id && (
                          <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black shrink-0">
                            אתה
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-amber-600 shrink-0 mr-2">{entry.points}</span>
                  </div>
                ))}
                
                {userRankEntry && (
                  <>
                    <div className="col-span-full flex items-center justify-center py-1">
                      <div className="w-1 h-1 rounded-full bg-slate-300 mx-0.5"></div>
                      <div className="w-1 h-1 rounded-full bg-slate-300 mx-0.5"></div>
                      <div className="w-1 h-1 rounded-full bg-slate-300 mx-0.5"></div>
                    </div>
                    <div className="flex items-center justify-between bg-amber-50 px-3 py-2 rounded-xl border border-amber-300 shadow-sm text-xs group">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-black text-slate-500 w-6">{userRankEntry.rank}.</span>
                        <img src={getAvatarImage(userRankEntry.avatarIcon)} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-700 truncate group-hover:text-amber-700 transition-colors">
                            {getDisplayName(userRankEntry.username, userRankEntry.firstName, userRankEntry.lastName, true, user.isAdmin)}
                          </span>
                          <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black shrink-0">
                            אתה
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-amber-600 shrink-0 mr-2">{userRankEntry.points}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-4 px-2 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-sm text-slate-500 font-bold">אין עדיין שיאים במשחק זה.</p>
                <p className="text-xs text-amber-600 font-black mt-1">שחק עכשיו והיה הראשון בטבלה!</p>
              </div>
            )}
          </div>

          {/* Game Achievements (Badges) */}
          {gameBadges.length > 0 && (
            <div className="bg-slate-50/80 border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800 font-black text-sm mb-2 border-b border-slate-200 pb-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <h3>הישגים במשחק זה</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {gameBadges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      badge.unlocked 
                        ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' 
                        : 'bg-white border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      badge.unlocked
                        ? 'bg-yellow-400 text-indigo-950 shadow-inner text-xl'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {badge.unlocked ? '🏆' : <Lock className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-slate-900 text-sm">{badge.title}</h4>
                        {badge.unlocked && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full font-extrabold">
                            הושג
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight font-medium">{badge.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="pt-1.5 space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                          <span>התקדמות</span>
                          <span>{badge.progress} / {badge.maxProgress}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${badge.unlocked ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${Math.min(100, (badge.progress / badge.maxProgress) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          {!user.isFirebaseUser && (
            <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between font-bold shadow-sm">
              <span>💡 להתחברות לחשבון שחקן כדי לכתוב תגובות, לדרג ולשמור ניקוד</span>
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-lg font-black transition-transform hover:scale-105 shadow-sm"
                >
                  התחברות לחשבון
                </button>
              )}
            </div>
          )}

          {/* Comment List */}
          <div className="space-y-4 mb-8 max-h-[500px] overflow-y-auto pl-2">
            {comments.map((comm) => (
              <div key={comm.id} className="bg-slate-50/80 border border-slate-200 p-4 rounded-xl flex gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xl shrink-0 shadow-inner overflow-hidden">
                  <img src={getAvatarImage(comm.userAvatar)} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {comm.userId === user.id || comm.userName === user.username
                          ? comm.userName
                          : getDisplayName(comm.userName, undefined, undefined, comm.userId === user.id, user.isAdmin)}
                      </span>
                      {(comm.userId === user.id || comm.userName === user.username) && (
                        <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full font-bold">
                          אתה
                        </span>
                      )}
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

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{comm.content}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {(comm.userId === user.id || user.isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comm.id)}
                          className="group flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all cursor-pointer active:scale-95"
                          title="מחק תגובה"
                        >
                          <Trash2 className="w-3.5 h-3.5 transition-colors" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleLikeComment(comm)}
                        className={`group flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer active:scale-95 ${
                          comm.likedBy?.includes(user.id)
                            ? 'bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                        title={comm.likedBy?.includes(user.id) ? "ביטול לייק" : "לייק לתגובה"}
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${comm.likedBy?.includes(user.id) ? 'fill-rose-600 text-rose-600' : 'fill-transparent text-slate-400 group-hover:text-slate-600'}`} />
                        <span>{comm.likes || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm font-medium">
                אין עדיין תגובות למשחק זה. היה הראשון להגיב!
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">הוסף/החלף תגובה ודירוג:</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "משחק מצוין ומחכים! 💡",
                "נהניתי מאוד לשחק 🤩",
                "ממליץ בחום לכולם 👍",
                "כיף גדול ולמדתי המון 📚",
                "לא אהבתי 😕",
                "לא הבנתי בכלל את המשחק 🤷‍♂️",
                "משחק קשה מדי 😓",
                "כדאי לשפר את ההוראות 📝"
              ].map((text) => (
                <button
                  key={text}
                  type="button"
                  disabled={!user.isFirebaseUser}
                  onClick={() => setCommentText(text)}
                  className={`text-right px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                    commentText === text
                      ? 'bg-indigo-100 border-indigo-500 text-indigo-900 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                  } ${!user.isFirebaseUser ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-[0.98]'}`}
                >
                  {text}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim() || !user.isFirebaseUser}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm transition-all shadow-sm ${
                  !commentText.trim() || !user.isFirebaseUser
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-indigo-950 active:scale-95'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{user.isFirebaseUser ? 'פרסם תגובה' : 'התחבר לפרסום'}</span>
              </button>
            </div>
          </form>

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
                <div className={`h-24 rounded-xl bg-gradient-to-br ${getGameThumbnailBgClass(relGame)} flex items-center justify-center mb-3 shadow-inner relative overflow-hidden`}>
                  {getGameThumbnailUrl(relGame) && (
                    <img
                      src={getGameThumbnailUrl(relGame)}
                      alt={relGame.title}
                      className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  <Play className="w-8 h-8 text-white group-hover:scale-125 transition-transform relative z-10" />
                </div>
                <div className="text-xs text-indigo-600 font-bold mb-1">{relGame.category}</div>
                <h4 className="font-black text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600">{relGame.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">{relGame.description}</p>
              </div>
            ))}
          </div>
        </div>
        </>
        )}

      </div>
    </div>
  );
};
