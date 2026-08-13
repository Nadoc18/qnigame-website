import { Badge, UserProfile, Game } from '../types';
import { INITIAL_BADGES } from '../data/badgesData';

/**
 * Event types that can trigger a badge progression
 */
export interface BadgeEvent {
  type: 'GAME_PLAYED' | 'HIGH_SCORE' | 'TRIVIA_STREAK' | 'SHABBAT_COMPLETED' | 'MENORAH_SOLVED' | 'WORDLE_WON';
  gameId: string;
  gameTags?: string[]; // Added tags property for metadata-based rules
  value?: number; // Score, streak count, etc.
}

/**
 * Ensures the user has all badges initialized.
 */
export const initializeBadges = (userBadges?: Badge[]): Badge[] => {
  const currentBadges = Array.isArray(userBadges) ? userBadges : [];
  
  // Merge current badges with the master catalog to ensure no missing badges
  return INITIAL_BADGES.map(masterBadge => {
    const existingBadge = currentBadges.find(b => b.id === masterBadge.id);
    if (existingBadge) {
      return { ...masterBadge, ...existingBadge }; // Keep user's progress, but update title/desc from master
    }
    return { ...masterBadge };
  });
};

/**
 * Returns the list of badges that can be earned in a specific game.
 * Used for displaying game-specific achievements in the game portal.
 */
export const getBadgesForGame = (game: Game, userBadges?: Badge[]): Badge[] => {
  const allBadges = initializeBadges(userBadges);
  
  return allBadges.filter(badge => {
    // 1. Explicitly related by ID
    if (badge.relatedGameIds && badge.relatedGameIds.includes(game.id)) {
      return true;
    }
    
    // 2. Dynamic Tag-based relations
    if (badge.id === 'shabbat_lover' && game.tags && (game.tags.includes('שבת') || game.tags.includes('שבת וחגים'))) {
      return true;
    }

    return false;
  });
};

/**
 * Processes a game event and updates the user's badges.
 * Returns an object containing the updated badges array and any newly unlocked badges.
 */
export const processBadgeEvent = (
  currentProfile: UserProfile,
  event: BadgeEvent
): { updatedBadges: Badge[], newlyUnlocked: Badge[] } => {
  const badges = initializeBadges(currentProfile.badges);
  const newlyUnlocked: Badge[] = [];

  const updateProgress = (badgeId: string, newProgress: number, incremental: boolean = false) => {
    const badge = badges.find(b => b.id === badgeId);
    if (!badge || badge.unlocked) return;

    if (incremental) {
      badge.progress += newProgress;
    } else {
      if (newProgress > badge.progress) {
        badge.progress = newProgress;
      }
    }

    if (badge.progress >= badge.maxProgress) {
      badge.progress = badge.maxProgress;
      badge.unlocked = true;
      badge.unlockedAt = new Date().toLocaleDateString('he-IL');
      newlyUnlocked.push({ ...badge });
    }
  };

  // 1. torah_beginner: Play first game
  if (event.type === 'GAME_PLAYED') {
    updateProgress('torah_beginner', 1, true);
  }

  // 2. brachot_master: Get 500 points in Brachot game
  if (event.type === 'HIGH_SCORE' && (event.gameId === 'brachot' || event.gameId === 'brachot_race')) {
    updateProgress('brachot_master', event.value || 0, false);
  }

  // 3. trivia_expert: 10 streak in Trivia
  if (event.type === 'TRIVIA_STREAK' && event.gameId === 'trivia') {
    updateProgress('trivia_expert', event.value || 0, false);
  }

  // 4. shabbat_guardian: Complete Shabbat steps
  if (event.type === 'SHABBAT_COMPLETED' && event.gameId === 'shabbat') {
    updateProgress('shabbat_guardian', 1, true);
  }

  // 5. menorah_builder: Solve Menorah puzzle on hard
  if (event.type === 'MENORAH_SOLVED' && event.gameId === 'menorah_puzzle') {
    if (event.value === 3) { // Assume value=3 means hard mode
      updateProgress('menorah_builder', 1, false);
    }
  }

  // 6. tanach_wordle_hero: Guess characters in Tanach Wordle
  if (event.type === 'WORDLE_WON' && event.gameId === 'tanach_wordle') {
    updateProgress('tanach_wordle_hero', 1, true);
  }

  // 7. shabbat_lover: Play 3 games with the Shabbat tag
  if (event.type === 'GAME_PLAYED' && event.gameTags && (event.gameTags.includes('שבת') || event.gameTags.includes('שבת וחגים'))) {
    updateProgress('shabbat_lover', 1, true);
  }

  return { updatedBadges: badges, newlyUnlocked };
};
