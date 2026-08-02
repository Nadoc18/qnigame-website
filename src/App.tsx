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

import { GAMES_LIST } from './data/gamesData';
import { NEWS_ARTICLES } from './data/newsData';
import { INITIAL_BADGES } from './data/badgesData';
import { Game, GameCategory, UserProfile } from './types';
import { soundManager } from './utils/audio';
import { cloudGamesService } from './services/cloudGamesService';
import { FirebaseAuthModal } from './components/FirebaseAuthModal';
import { auth, syncUserProfile, saveUserProfileToFirestore, subscribeToUserProfile } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { getShabbatTimes, ShabbatInfo } from './utils/shabbat';
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
  const [activeTab, setActiveTab] = useState<'landing' | 'news' | 'leaderboard' | 'account'>('landing');
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

  // Load Games & Shabbat times automatically on startup
  const loadGames = async () => {
    try {
      const result = await cloudGamesService.fetchGamesFromCloud();
      if (result.games && result.games.length > 0) {
        setGamesList(result.games);
      }
    } catch (error) {
      console.error("Error loading games library:", error);
    }
  };

  useEffect(() => {
    loadGames();
    getShabbatTimes().then(setShabbatInfo).catch(console.error);
  }, []);

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

  // Persist user in localStorage and sync with Firestore if logged in
  useEffect(() => {
    localStorage.setItem('jewish_games_hub_user', JSON.stringify(user));
    if (user.isFirebaseUser) {
      saveUserProfileToFirestore(user);
    }
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
      const newLevel = Math.max(prev.level, Math.floor(newPoints / 300) + 1);
      const newTitle = getTitleForLevel(newLevel);

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
            onSelectGame={handleSelectGame}
            allGames={gamesList}
          />
        ) : activeTab === 'landing' ? (
          <LandingPage
            games={gamesList}
            news={NEWS_ARTICLES}
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
            articles={NEWS_ARTICLES}
            selectedArticleId={selectedNewsId}
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
