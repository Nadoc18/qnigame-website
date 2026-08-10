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

import { GAMES_LIST } from './data/gamesData';
import { NEWS_ARTICLES } from './data/newsData';
import { INITIAL_BADGES } from './data/badgesData';
import { Game, GameCategory, UserProfile, NewsArticle } from './types';
import { soundManager } from './utils/audio';
import { cloudGamesService } from './services/cloudGamesService';
import { FirebaseAuthModal } from './components/FirebaseAuthModal';
import { auth, syncUserProfile, saveUserProfileToFirestore, saveGameProgressToFirestore, subscribeToUserProfile, updateLeaderboardEntry, subscribeToNewsArticles } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { getShabbatTimes, ShabbatInfo } from './utils/shabbat';
import { getLevelDetails } from './utils/levels';
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
  avatarIcon: '👤',
  avatarBg: 'from-emerald-500 to-emerald-700',
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

  // Automated Shabbat detection state
  const [shabbatInfo, setShabbatInfo] = useState<ShabbatInfo | null>(null);

  // Games library state
  const [gamesList, setGamesList] = useState<Game[]>(GAMES_LIST);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // News State
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(NEWS_ARTICLES);

  // Load Games from Cloud

  // Load / Save state from localStorage
  const [user, setUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jewish_games_hub_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_USER;
  });

  // Load Games from Cloud
  useEffect(() => {
    const loadGames = async () => {
      try {
        const result = await cloudGamesService.fetchGamesFromCloud(user.isAdmin || false);
        if (result.games && result.games.length > 0) {
          setGamesList(result.games);
        }
      } catch (err) {
        console.error('Error loading games:', err);
      }
    };
    loadGames();
    getShabbatTimes().then(setShabbatInfo).catch(console.error);
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
      if (fbUser) {
        try {
          const syncedProfile = await syncUserProfile(fbUser, INITIAL_USER);
          setUser({
            ...syncedProfile,
            isFirebaseUser: true,
          });

          // Ensure the user is ALWAYS in the public leaderboard when they log in
          updateLeaderboardEntry({ ...syncedProfile, isFirebaseUser: true }).catch(console.error);

          // Subscribe to live profile changes in Firestore
          unsubSnapshot = subscribeToUserProfile(fbUser.uid, (updatedData) => {
            setUser((prev) => ({
              ...prev,
              ...updatedData,
              isFirebaseUser: true,
            }));
          });
        } catch (error) {
          console.error('Error syncing profile:', error);
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
      const earnedPoints = Math.max(10, Math.floor(score / 5));
      const newPoints = prev.points + earnedPoints;
      const newCoins = prev.coins + Math.max(5, Math.floor(score / 10));
      const lvlDetails = getLevelDetails(newPoints);
      const newLevel = lvlDetails.level;
      const newTitle = lvlDetails.title;

      const nextUser = {
        ...prev,
        points: newPoints,
        coins: newCoins,
        level: newLevel,
        title: newTitle,
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

  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const [authCustomMsg, setAuthCustomMsg] = useState<string | undefined>(undefined);

  const handleSelectGame = (gameId: string) => {
    if (!user.isFirebaseUser) {
      setPendingGameId(gameId);
      setAuthCustomMsg('כדי לשחק ולשמור את הניקוד וההישגים שלך, יש להתחבר לחשבון שחקן');
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedGameId(gameId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    if (pendingGameId) {
      setSelectedGameId(pendingGameId);
      setPendingGameId(null);
      setAuthCustomMsg(undefined);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setSelectedGameId(pendingGameId);
      setPendingGameId(null);
      setAuthCustomMsg(undefined);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      />
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
    </div>
  );
}
