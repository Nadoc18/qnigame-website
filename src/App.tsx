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
import { auth, syncUserProfile, saveUserProfileToFirestore } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { Leaderboard } from './components/Leaderboard';

const INITIAL_USER: UserProfile = {
  id: 'user-1',
  username: 'לומד תורה',
  title: 'תלמיד חכם',
  level: 3,
  points: 450,
  coins: 120,
  avatarIcon: '🎓',
  avatarBg: 'from-amber-500 to-amber-700',
  joinedDate: 'תמוז תשפ"ו',
  favoriteGameIds: ['trivia-jewish-master', 'brachot-runner-game'],
  badges: INITIAL_BADGES,
  gameStats: {
    'trivia-jewish-master': {
      gameId: 'trivia-jewish-master',
      gameTitle: 'טריוויה יהודית - אלופי התנ"ך וההלכה',
      highScore: 320,
      playsCount: 12,
      lastPlayed: 'אתמול',
    },
    'brachot-runner-game': {
      gameId: 'brachot-runner-game',
      gameTitle: 'מרוץ הברכות והכשרות',
      highScore: 150,
      playsCount: 5,
      lastPlayed: 'לפני 3 ימים',
    },
  },
  bio: 'אוהב ללמוד תורה דרך משחקים ומשימות דעת עם המשפחה והחברים.',
  shabbatModeEnabled: false,
  soundEnabled: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'news' | 'leaderboard' | 'account'>('landing');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<string | undefined>(undefined);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('הכל');
  const [shabbatMode, setShabbatMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Games library state
  const [gamesList, setGamesList] = useState<Game[]>(GAMES_LIST);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load Games automatically on startup
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const syncedProfile = await syncUserProfile(fbUser, INITIAL_USER);
          setUser({
            ...syncedProfile,
            isFirebaseUser: true,
          });
        } catch (error) {
          console.error('Error syncing profile:', error);
        }
      } else {
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

    return () => unsubscribe();
  }, []);

  // Persist user in localStorage and sync with Firestore if logged in
  useEffect(() => {
    localStorage.setItem('jewish_games_hub_user', JSON.stringify(user));
    if (user.isFirebaseUser) {
      saveUserProfileToFirestore(user);
    }
  }, [user]);

  useEffect(() => {
    soundManager.enabled = soundOn;
  }, [soundOn]);

  const handleToggleFavorite = (gameId: string) => {
    setUser((prev) => {
      const exists = prev.favoriteGameIds.includes(gameId);
      const nextFavs = exists
        ? prev.favoriteGameIds.filter((id) => id !== gameId)
        : [...prev.favoriteGameIds, gameId];

      return {
        ...prev,
        favoriteGameIds: nextFavs,
      };
    });
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
      const newPoints = prev.points + Math.floor(score / 10);

      return {
        ...prev,
        points: newPoints,
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

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${
      shabbatMode ? 'bg-[#1f3416] text-amber-100' : 'bg-slate-50 text-slate-800'
    }`} dir="rtl">

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

      {/* Top Shabbat Mode Banner */}
      <ShabbatBanner
        shabbatMode={shabbatMode}
        onClose={() => setShabbatMode(false)}
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
        shabbatMode={shabbatMode}
        setShabbatMode={setShabbatMode}
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
          <Leaderboard currentUser={user} />
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
      <Footer />
    </div>
  );
}
