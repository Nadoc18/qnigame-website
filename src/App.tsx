/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ShabbatBanner } from './components/ShabbatBanner';
import { LandingPage } from './components/LandingPage';
import { GamePlayerFrame } from './components/GamePlayerFrame';
import { AccountProfile } from './components/AccountProfile';
import { NewsPage } from './components/NewsPage';
import { AdminNewsPage } from './components/AdminNewsPage';
import { MaintenancePage } from './components/MaintenancePage';
import { FirebaseAuthModal } from './components/FirebaseAuthModal';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { VerifyEmailPage } from './components/VerifyEmailPage';
import { PremiumModal } from './components/PremiumModal';

import { GAMES_LIST } from './data/gamesData';
import { NEWS_ARTICLES } from './data/newsData';
import { INITIAL_BADGES } from './data/badgesData';
import { Game, GameCategory, UserProfile, NewsArticle, SubscriptionTier } from './types';
import { soundManager } from './utils/audio';
import { cloudGamesService } from './services/cloudGamesService';
import { auth, syncUserProfile, saveUserProfileToFirestore, saveGameProgressToFirestore, subscribeToUserProfile, updateLeaderboardEntry, subscribeToNewsArticles, subscribeToGlobalSettings } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { getShabbatTimes, ShabbatInfo } from './utils/shabbat';
import { getLevelDetails } from './utils/levels';
import { processBadgeEvent, BadgeEvent, initializeBadges } from './utils/BadgeEngine';
import { LevelUpModal } from './components/LevelUpModal';
import { ShabbatRestScreen } from './components/ShabbatRestScreen';
import { Leaderboard } from './components/Leaderboard';

const INITIAL_USER: UserProfile = {
  id: 'user-guest',
  username: 'אורח',
  title: 'אורח',
  level: 1,
  points: 0,
  coins: 0,
  avatarIcon: '/avatars/shofar.png',
  avatarBg: 'from-amber-500 to-amber-700',
  joinedDate: '',
  favoriteGameIds: [],
  badges: INITIAL_BADGES,
  gameStats: {},
  bio: 'לומד תורה וערכים בקניגיים.',
  shabbatModeEnabled: false,
  soundEnabled: true,
  isFirebaseUser: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'news' | 'leaderboard' | 'account' | 'admin-secret-qni-8x7a9'>('landing');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<string | undefined>(undefined);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('הכל');
  const [soundOn, setSoundOn] = useState(true);

  // Badge Notification State
  const [unlockedBadge, setUnlockedBadge] = useState<any | null>(null);

  // Automated Shabbat detection state
  const [shabbatInfo, setShabbatInfo] = useState<ShabbatInfo | null>(null);

  // Games library state
  const [gamesList, setGamesList] = useState<Game[]>(GAMES_LIST);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [requiredPremiumTier, setRequiredPremiumTier] = useState<SubscriptionTier | undefined>(undefined);
  const [authCustomMsg, setAuthCustomMsg] = useState<string | undefined>(undefined);
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  
  // News State
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(NEWS_ARTICLES);

  // Global Settings State
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
  const [isMonetizationEnabled, setIsMonetizationEnabled] = useState<boolean>(true);

  // Password Reset Interception State
  const [resetOobCode, setResetOobCode] = useState<string | null>(null);
  const [verifyEmailOobCode, setVerifyEmailOobCode] = useState<string | null>(null);

  // Load Games from Cloud

  // Load / Save state from localStorage
  const [user, setUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jewish_games_hub_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // silent
        }
      }
    }
    return INITIAL_USER;
  });

  // Check URL for custom password reset code or email verification on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const oobCode = urlParams.get('oobCode');
      if (mode === 'resetPassword' && oobCode) {
        setResetOobCode(oobCode);
      } else if (mode === 'verifyEmail' && oobCode) {
        setVerifyEmailOobCode(oobCode);
      }
    }
  }, []);

  // Load Games from Cloud
  useEffect(() => {
    const loadGames = async () => {
      try {
        const result = await cloudGamesService.fetchGamesFromCloud(user.isAdmin || false);
        if (result.games && result.games.length > 0) {
          // Temporary merge for local testing: inject accessLevel from gamesData.ts
          const mergedGames = result.games.map(cloudGame => {
            const localGame = GAMES_LIST.find(g => g.id === cloudGame.id);
            return {
              ...cloudGame,
              accessLevel: localGame?.accessLevel || cloudGame.accessLevel
            };
          });
          setGamesList(mergedGames);
        }
      } catch (err) {
        // silent
      }
    };
    loadGames();
    getShabbatTimes().then(setShabbatInfo).catch(() => {});
  }, [user.isAdmin]);

  // Subscribe to Live News
  useEffect(() => {
    const unsubscribe = subscribeToNewsArticles(user.isAdmin || false, (articles) => {
      if (articles && articles.length > 0) {
        setNewsArticles(articles);
      }
    });
    return () => unsubscribe();
  }, [user.isAdmin]);

  // Subscribe to Global Settings
  useEffect(() => {
    const unsubscribe = subscribeToGlobalSettings((settings) => {
      setIsMaintenanceMode(settings.isMaintenanceMode || false);
      setIsMonetizationEnabled(settings.isMonetizationEnabled !== false);
    });
    return () => unsubscribe();
  }, []);

  // Level Up State
  const [acknowledgedLevels, setAcknowledgedLevels] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('qnigame_ack_levels');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [pendingLevelUp, setPendingLevelUp] = useState<{ title: string; level: number } | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [isDismissingLevelUp, setIsDismissingLevelUp] = useState(false);
  
  // Robustly track level changes regardless of source (game, firebase sync, manual)
  useEffect(() => {
    if (!user.id) return;
    
    const ackLevel = acknowledgedLevels[user.id];
    
    if (ackLevel === undefined) {
      // First time seeing this user on this device, just set their current level as acknowledged silently
      const newAcks = { ...acknowledgedLevels, [user.id]: user.level };
      setAcknowledgedLevels(newAcks);
      localStorage.setItem('qnigame_ack_levels', JSON.stringify(newAcks));
    } else if (user.level > ackLevel) {
      // They leveled up!
      setPendingLevelUp({ title: user.title, level: user.level });
      // We don't update ackLevel yet, we'll update it when they dismiss the modal
    } else if (user.level < ackLevel) {
      // Admin reset their level downwards (e.g. testing). Reset ackLevel so they can trigger the popup again.
      const newAcks = { ...acknowledgedLevels, [user.id]: user.level };
      setAcknowledgedLevels(newAcks);
      localStorage.setItem('qnigame_ack_levels', JSON.stringify(newAcks));
    }
  }, [user.id, user.level, user.title, acknowledgedLevels]);

  // Show modal when returning to main screen if a level up is pending
  useEffect(() => {
    if (!selectedGameId && pendingLevelUp && !showLevelUpModal && !isDismissingLevelUp) {
      setShowLevelUpModal(true);
    }
  }, [selectedGameId, pendingLevelUp, showLevelUpModal, isDismissingLevelUp]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    let unsubSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.emailVerified) {
        try {
          const syncedProfile = await syncUserProfile(fbUser, INITIAL_USER);
          setUser({
            ...syncedProfile,
            isFirebaseUser: true,
          });

          // Ensure the user is ALWAYS in the public leaderboard when they log in
          updateLeaderboardEntry({ ...syncedProfile, isFirebaseUser: true }).catch(() => {});

          // Subscribe to live profile changes in Firestore
          unsubSnapshot = subscribeToUserProfile(fbUser.uid, (updatedData) => {
            setUser((prev) => ({
              ...prev,
              ...updatedData,
              isFirebaseUser: true,
            }));
          });
        } catch (error) {
          // silent
        }
      } else {
        if (unsubSnapshot) unsubSnapshot();
        // User logged out - fallback to local user
        setUser((prev) => {
          if (prev.isFirebaseUser) {
            return {
              ...INITIAL_USER,
              isFirebaseUser: false,
            };
          }
          return prev;
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  // Persist user state in localStorage
  useEffect(() => {
    localStorage.setItem('jewish_games_hub_user', JSON.stringify(user));
  }, [user]);

  // If user is not logged in and attempts to view 'account' tab, redirect to landing
  useEffect(() => {
    if (!user.isFirebaseUser && activeTab === 'account') {
      setActiveTab('landing');
    }
  }, [user.isFirebaseUser, activeTab]);

  useEffect(() => {
    soundManager.enabled = soundOn;
  }, [soundOn]);

  const handleToggleFavorite = (gameId: string) => {
    setUser((prev) => {
      const exists = prev.favoriteGameIds.includes(gameId);
      const nextFavs = exists
        ? prev.favoriteGameIds.filter((id) => id !== gameId)
        : [...prev.favoriteGameIds, gameId];

      const nextUser = {
        ...prev,
        favoriteGameIds: nextFavs,
      };

      if (prev.isFirebaseUser) {
        saveUserProfileToFirestore(nextUser);
      }

      return nextUser;
    });
  };

  const getTitleForLevel = (lvl: number): string => {
    if (lvl >= 10) return 'שר התורה';
    if (lvl >= 7) return 'עילוי בתורה';
    if (lvl >= 5) return 'תלמיד חכם';
    if (lvl >= 3) return 'לומד שוקד';
    return 'בחור כהלכה';
  };

  const handleRecordScore = (gameId: string, score: number) => {
    setUser((prev) => {
      const currentStat = prev.gameStats[gameId] || {
        gameId,
        gameTitle: gamesList.find((g) => g.id === gameId)?.title || '',
        highScore: 0,
        playsCount: 0,
        lastPlayed: 'עכשיו',
      };

      const newHighScore = Math.max(currentStat.highScore, score);
      const diff = score - currentStat.highScore;
      const earnedPoints = diff > 0 ? diff : 0;
      
      const newPoints = prev.points + earnedPoints;
      const newCoins = prev.coins; // Coins feature removed as per user request
      const lvlDetails = getLevelDetails(newPoints);
      const newLevel = lvlDetails.level;
      const newTitle = lvlDetails.title;
      
      const gameInfo = gamesList.find((g) => g.id === gameId);

      const events: BadgeEvent[] = [
        { type: 'GAME_PLAYED', gameId, gameTags: gameInfo?.tags },
        { type: 'HIGH_SCORE', gameId, value: score, gameTags: gameInfo?.tags }
      ];

      // Temporary specific mappings based on gameId until Unity sends explicit events
      if (gameId === 'trivia') events.push({ type: 'TRIVIA_STREAK', gameId, value: Math.floor(score / 10) }); // Assume 1 streak = 10 pts
      if (gameId === 'shabbat') events.push({ type: 'SHABBAT_COMPLETED', gameId });
      if (gameId === 'menorah_puzzle') events.push({ type: 'MENORAH_SOLVED', gameId, value: 3 }); // Hard mode assumed
      if (gameId === 'tanach_wordle') events.push({ type: 'WORDLE_WON', gameId });

      let currentBadges = prev.badges || [];
      let allNewlyUnlocked: any[] = [];

      events.forEach(event => {
        const result = processBadgeEvent({ ...prev, badges: currentBadges }, event);
        currentBadges = result.updatedBadges;
        if (result.newlyUnlocked.length > 0) {
          allNewlyUnlocked.push(...result.newlyUnlocked);
        }
      });

      if (allNewlyUnlocked.length > 0) {
        // Just show the first one in the toast if multiple unlocked at once
        setUnlockedBadge(allNewlyUnlocked[0]);
        // Auto-hide toast after 4s
        setTimeout(() => setUnlockedBadge(null), 4000);
      }

      const nextUser = {
        ...prev,
        points: newPoints,
        coins: newCoins,
        level: newLevel,
        title: newTitle,
        badges: currentBadges,
        gameStats: {
          ...prev.gameStats,
          [gameId]: {
            ...currentStat,
            highScore: newHighScore,
            playsCount: currentStat.playsCount + 1,
            lastPlayed: 'עכשיו',
          },
        },
      };

      if (prev.isFirebaseUser) {
        saveUserProfileToFirestore(nextUser);
      }

      return nextUser;
    });
  };

  const handleSaveGameProgress = (gameId: string, progressData: any) => {
    if (!gameId || !progressData) return;

    setUser((prev) => {
      const nextUser = {
        ...prev,
        gameProgress: {
          ...(prev.gameProgress || {}),
          [gameId]: progressData
        }
      };

      if (prev.isFirebaseUser) {
        saveGameProgressToFirestore(prev.id, gameId, progressData);
      }

      return nextUser;
    });
  };

  const handleSelectGame = (gameId: string) => {
    const game = gamesList.find(g => g.id === gameId);
    if (!game) return;

    if (!user.isFirebaseUser) {
      setPendingGameId(gameId);
      setAuthCustomMsg('כדי לשחק ולשמור את הניקוד וההישגים שלך, יש להתחבר לחשבון שחקן');
      setIsAuthModalOpen(true);
      return;
    }

    if (game.accessLevel && game.accessLevel !== 'FREE') {
      // Bypass check if Monetization is OFF globally, OR if User is Admin, OR if User is VIP
      const isBypassed = !isMonetizationEnabled || user.isAdmin || user.isVip;

      if (!isBypassed) {
        const tier = user.subscriptionTier || 'FREE';
        let hasAccess = false;
        if (tier === 'TIER_2') hasAccess = true;
        if (tier === 'TIER_1' && game.accessLevel === 'TIER_1') hasAccess = true;

        if (!hasAccess) {
          setRequiredPremiumTier(game.accessLevel);
          setIsPremiumModalOpen(true);
          return;
        }
      }
    }

    setSelectedGameId(gameId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async () => {
    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        const syncedProfile = await syncUserProfile(auth.currentUser, INITIAL_USER);
        setUser({
          ...syncedProfile,
          isFirebaseUser: true,
        });
      } catch (err) {
        // silent
      }
    }

    if (pendingGameId) {
      const gameIdToLaunch = pendingGameId;
      setPendingGameId(null);
      setAuthCustomMsg(undefined);
      handleSelectGame(gameIdToLaunch); // re-evaluate access after login
    }
  };

  const handleQuickTestLogin = () => {
    setUser((prev) => ({
      ...prev,
      username: prev.username || 'לומד תורה',
      isFirebaseUser: true,
    }));
    setIsAuthModalOpen(false);
    if (pendingGameId) {
      const gameIdToLaunch = pendingGameId;
      setPendingGameId(null);
      setAuthCustomMsg(undefined);
      handleSelectGame(gameIdToLaunch); // re-evaluate access after mock login
    }
  };

  const handleOpenNews = (articleId: string) => {
    setSelectedNewsId(articleId);
    setActiveTab('news');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentGame = gamesList.find((g) => g.id === selectedGameId);

  const isShabbatActive = Boolean(shabbatInfo?.isShabbat);

  // If Shabbat is currently active according to Hebcal/geolocation, show full-screen Shabbat Rest Screen
  if (isShabbatActive) {
    return (
      <ShabbatRestScreen
        shabbatInfo={
          shabbatInfo || {
            isShabbat: true,
            parasha: 'פרשת השבוע',
            candleLightingStr: '19:18',
            havdalahStr: '20:22',
            candleLightingDate: null,
            havdalahDate: null,
            locationName: 'ישראל',
          }
        }
        onBypass={() => setShabbatInfo(null)}
      />
    );
  }

  // Intercept normal rendering for custom password reset page
  if (resetOobCode) {
    return (
      <ResetPasswordPage 
        oobCode={resetOobCode} 
        onSuccess={() => {
          setResetOobCode(null);
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsAuthModalOpen(true);
        }}
        onCancel={() => {
          setResetOobCode(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  // Intercept normal rendering for email verification page
  if (verifyEmailOobCode) {
    return (
      <VerifyEmailPage 
        oobCode={verifyEmailOobCode} 
        onContinue={() => {
          setVerifyEmailOobCode(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  // Prevent flash of normal content while checking maintenance mode
  if (isMaintenanceMode === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-amber-500/80 font-bold text-sm animate-pulse">טוען נתונים...</p>
      </div>
    );
  }

  if (isMaintenanceMode && !user?.isAdmin) {
    return (
      <div className="font-sans text-slate-800" dir="rtl">
        <FirebaseAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setAuthCustomMsg(undefined);
          }}
          currentUser={user}
          customMessage={authCustomMsg}
          onAuthSuccess={handleAuthSuccess}
          onQuickTestLogin={handleQuickTestLogin}
        />
        <MaintenancePage onOpenAuthModal={() => setIsAuthModalOpen(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col transition-colors duration-300 bg-slate-50 text-slate-800" dir="rtl">

      {/* Auth Login/Register Modal */}
      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthCustomMsg(undefined);
        }}
        currentUser={user}
        customMessage={authCustomMsg}
        onAuthSuccess={handleAuthSuccess}
        onQuickTestLogin={handleQuickTestLogin}
      />

      {/* Level Up Celebration Modal */}
      {(pendingLevelUp || isDismissingLevelUp) && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          onClose={() => {
            setIsDismissingLevelUp(true);
            setShowLevelUpModal(false);
            
            // Mark the new level as acknowledged
            if (user.id && pendingLevelUp) {
              const newAcks = { ...acknowledgedLevels, [user.id]: pendingLevelUp.level };
              setAcknowledgedLevels(newAcks);
              localStorage.setItem('qnigame_ack_levels', JSON.stringify(newAcks));
            }

            setTimeout(() => {
              setPendingLevelUp(null);
              setIsDismissingLevelUp(false);
            }, 500); // clear after animation
          }}
          newTitle={pendingLevelUp?.title || ''}
          newLevel={pendingLevelUp?.level || 0}
        />
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'landing') setSelectedGameId(null);
        }}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (selectedGameId) setSelectedGameId(null);
          if (activeTab !== 'landing') setActiveTab('landing');
        }}
        user={user}
        soundOn={soundOn}
        setSoundOn={setSoundOn}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {selectedGameId && currentGame ? (
          <GamePlayerFrame
            game={currentGame}
            onBack={() => setSelectedGameId(null)}
            user={user}
            onToggleFavorite={handleToggleFavorite}
            onRecordScore={handleRecordScore}
            onSaveGameProgress={handleSaveGameProgress}
            onSelectGame={handleSelectGame}
            allGames={gamesList}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        ) : activeTab === 'landing' ? (
          <LandingPage
            games={gamesList}
            news={newsArticles}
            user={user}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onOpenNews={handleOpenNews}
          />
        ) : activeTab === 'news' ? (
          <NewsPage
            articles={newsArticles}
            selectedArticleId={selectedNewsId}
            user={user}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        ) : activeTab === 'admin-secret-qni-8x7a9' ? (
          <AdminNewsPage
            articles={newsArticles}
            user={user}
            allGames={gamesList}
          />
        ) : activeTab === 'leaderboard' ? (
          <Leaderboard 
            currentUser={user} 
            onOpenAuthModal={() => setIsAuthModalOpen(true)} 
          />
        ) : (
          <AccountProfile
            user={user}
            setUser={setUser}
            allGames={gamesList}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer shabbatInfo={shabbatInfo} />

      {/* Badge Notification Toast */}
      {unlockedBadge && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center gap-4">
            <div className="text-4xl animate-pulse">🏆</div>
            <div>
              <div className="text-amber-100 text-sm font-bold">הישג חדש נפתח!</div>
              <div className="font-black text-xl">{unlockedBadge.title}</div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Subscription Modal */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => {
          setIsPremiumModalOpen(false);
          setRequiredPremiumTier(undefined);
        }}
        user={user}
        requiredTier={requiredPremiumTier}
        onMockPaymentSuccess={(tier) => {
          setUser(prev => ({ ...prev, subscriptionTier: tier }));
          setIsPremiumModalOpen(false);
          setRequiredPremiumTier(undefined);
          
          // If they were trying to access a game, launch it now!
          if (pendingGameId) {
            const gameIdToLaunch = pendingGameId;
            setPendingGameId(null);
            handleSelectGame(gameIdToLaunch);
          }
        }}
      />
    </div>
  );
}
