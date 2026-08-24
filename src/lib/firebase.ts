import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  collection,
  onSnapshot,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Game, GameComment, NewsArticle } from '../types';
import { getLevelDetails } from '../utils/levels';
const isDev = import.meta.env.DEV;
// Always log errors to help debug production issues
const log = (...args: any[]) => { if (isDev) console.log(...args); };
const logError = (...args: any[]) => { console.error(...args); };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  logError('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
auth.languageCode = 'he'; // Ensure emails and Firebase auth pages are in Hebrew
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase auth persistence setup note:', err);
});
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Functions
export const functions = getFunctions(app, 'us-central1'); // Use default region, or match your function region if deployed elsewhere

export const getGamesFromFirestore = async (isAdmin: boolean = false): Promise<Game[]> => {
  const gamesPath = 'games';
  try {
    const qBase = collection(db, gamesPath);
    const q = isAdmin ? qBase : query(qBase, where('isAdminOnly', '==', false));
    const snap = await getDocs(q);
    const games: Game[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      // Map old category names to new names for backwards compatibility
      if (data.category === 'תנ"ך ומורשת') data.category = 'תנ"ך';
      if (data.category === 'ברכות והלכה') data.category = 'הלכה';
      if (data.category === 'טריוויה ודעת') data.category = 'טריוויה';
      if (data.category === 'חשיבה ופאזל') data.category = 'חשיבה';
      
      games.push({
        id: d.id,
        ...(data as Game)
      });
    });
    return games;
  } catch (error) {
    console.warn('Error fetching games from Firestore:', error);
    return [];
  }
};

export const incrementGameStats = async (gameId: string, playCountInc: number, timePlayedSecs: number): Promise<void> => {
  if (!gameId) return;
  try {
    const gameRef = doc(db, 'games', gameId);
    await setDoc(gameRef, {
      playCount: increment(playCountInc),
      totalTimePlayed: increment(timePlayedSecs)
    }, { merge: true });
  } catch (error) {
    console.warn('Failed to increment game stats in Firestore:', error);
  }
};

// Calculate dynamic ratings from gameComments to enrich games list on load
export const enrichGamesWithLiveRatings = async (games: Game[]): Promise<Game[]> => {
  if (isQuotaExceeded) return games;
  try {
    const commentsRef = collection(db, 'gameComments');
    const snap = await getDocs(commentsRef);
    
    // Group ratings by gameId
    const ratingsData: Record<string, { totalScore: number; count: number }> = {};
    
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const gameId = data.gameId;
      const rating = data.rating;
      if (gameId && typeof rating === 'number') {
        if (!ratingsData[gameId]) {
          ratingsData[gameId] = { totalScore: 0, count: 0 };
        }
        ratingsData[gameId].totalScore += rating;
        ratingsData[gameId].count += 1;
      }
    });

    return games.map(game => {
      const liveData = ratingsData[game.id];
      if (liveData && liveData.count > 0) {
        return {
          ...game,
          rating: Number((liveData.totalScore / liveData.count).toFixed(1)),
          ratingCount: liveData.count
        };
      }
      return game;
    });
  } catch (error) {
    checkAndHandleQuotaError(error);
    console.warn('Error enriching games with live ratings:', error);
    return games;
  }
};

/**
 * Helper to strip `undefined` values from an object before sending to Firestore,
 * as Firestore throws an error if any field value is `undefined`.
 */
function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val === undefined) return;
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      cleaned[key] = cleanFirestoreData(val);
    } else if (Array.isArray(val)) {
      cleaned[key] = val.filter(item => item !== undefined);
    } else {
      cleaned[key] = val;
    }
  });
  return cleaned;
}

// Helper to convert Firebase user + Firestore data to app's UserProfile
export const syncUserProfile = async (firebaseUser: FirebaseUser, defaultInitialUser?: UserProfile): Promise<UserProfile> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    const pts = data.points || 0;
    const levelInfo = getLevelDetails(pts);
    
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      username: data.username || firebaseUser.displayName || 'משתמש רשום',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      age: data.age || undefined,
      title: levelInfo.title,
      level: levelInfo.level,
      points: pts,
      coins: data.coins || 0,
      avatarIcon: (data.avatarIcon || '/player-icons/shofar.png').replace('/avatars/', '/player-icons/'),
      avatarBg: data.avatarBg || 'from-amber-500 to-amber-700',
      joinedDate: data.joinedDate || new Date().toLocaleDateString('he-IL'),
      favoriteGameIds: Array.isArray(data.favoriteGameIds) ? data.favoriteGameIds : [],
      badges: Array.isArray(data.badges) ? data.badges : (defaultInitialUser?.badges || []),
      gameStats: data.gameStats || (defaultInitialUser?.gameStats || {}),
      bio: data.bio || 'שוקד על דברי תורה וערכים בקניגיים.',
      shabbatModeEnabled: data.shabbatModeEnabled ?? false,
      soundEnabled: data.soundEnabled ?? true,
      isAdmin: data.isAdmin ?? false,
    };
  } else {
    // Create new profile in Firestore for first-time login
    const newProfile: UserProfile = {
      id: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'משתמש חדש',
      title: 'חבר קהילה',
      level: 1,
      points: 100,
      coins: 50,
      avatarIcon: '/player-icons/shofar.png',
      avatarBg: 'from-amber-500 to-amber-700',
      joinedDate: new Date().toLocaleDateString('he-IL'),
      favoriteGameIds: [],
      badges: defaultInitialUser?.badges || [],
      gameStats: {},
      gameProgress: {},
      bio: 'ברוך הבא לקניגיים! שוקד על תורה וערכים.',
      shabbatModeEnabled: false,
      soundEnabled: true,
    };

    const docData = cleanFirestoreData({
      ...newProfile,
      uid: firebaseUser.uid,
      updatedAt: new Date().toISOString()
    });

    await setDoc(userRef, docData);

    // Trigger welcome email via Firebase Extension (Trigger Email)
    if (newProfile.email) {
      try {
        const mailRef = collection(db, 'mail');
        await addDoc(mailRef, {
          to: newProfile.email,
          from: 'info@qnigame.com',
          message: {
            subject: 'ברוכים הבאים לקניגיים! 🎮',
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: right; background-color: #f8fafc; padding: 30px; border-radius: 20px; border: 2px solid #059669;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #059669; margin-bottom: 5px;">קניגיים</h1>
                  <p style="color: #64748b; font-size: 14px; margin-top: 0;">המרכז למשחקי יהדות וערכים</p>
                </div>
                
                <h2 style="color: #f59e0b;">שלום ${newProfile.username}! 👋</h2>
                <p style="font-size: 16px; line-height: 1.5;">ברוכים הבאים ל<strong>קניגיים</strong> - אנו שמחים מאוד שהצטרפתם לקהילה שלנו!</p>
                <p style="font-size: 16px; line-height: 1.5;">כבר עכשיו מחכים לכם <strong>100 נקודות במתנה</strong> להתחלה מהירה. שחקו, למדו, התקדמו וצברו נקודות!</p>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="https://qnigame.com" style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    היכנסו לאתר והתחילו לשחק
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 30px 0;" />
                <div style="text-align: center; color: #94a3b8; font-size: 12px;">
                  <p>צוות קניגיים</p>
                  <p>מייל זה נשלח אוטומטית. אין להשיב אליו.</p>
                </div>
              </div>
            `
          }
        });
      } catch (e) {
        logError('Failed to trigger welcome email', e);
      }
    }

    return newProfile;
  }
};

// Circuit breaker flag to prevent infinite failed network requests when free tier quota is hit
let isQuotaExceeded = false;

function checkAndHandleQuotaError(error: any): boolean {
  const errMsg = error?.message || String(error);
  if (errMsg.includes('resource-exhausted') || errMsg.includes('Quota limit exceeded') || error?.code === 'resource-exhausted') {
    if (!isQuotaExceeded) {
      isQuotaExceeded = true;
      console.warn('⚠️ Firestore daily write quota exceeded. Operating in local-storage mode for remainder of session.');
    }
    return true;
  }
  return false;
}

// Debounce timer & pending profile data for profile saves
let profileSaveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingProfileToSave: UserProfile | null = null;

// Save User Profile to Firestore (Debounced with 2-second delay to prevent quota exhaustion)
export const saveUserProfileToFirestore = async (userProfile: UserProfile, immediate = false) => {
  if (!userProfile.id || userProfile.id.startsWith('user-1') || userProfile.id.startsWith('guest')) {
    // Local / Guest user - don't save to cloud
    return;
  }
  if (isQuotaExceeded) return;

  pendingProfileToSave = userProfile;

  const executeSave = async () => {
    if (!pendingProfileToSave || isQuotaExceeded) return;
    const profileToSave = pendingProfileToSave;
    pendingProfileToSave = null;

    try {
      // Exclude isAdmin so we don't trigger Firestore security rules on update
      const { isAdmin, isFirebaseUser, ...restProfile } = profileToSave;

      const userRef = doc(db, 'users', profileToSave.id);
      const docData = cleanFirestoreData({
        ...restProfile,
        uid: profileToSave.id,
        updatedAt: new Date().toISOString()
      });
      await setDoc(userRef, docData, { merge: true });
      updateLeaderboardEntry(profileToSave);
    } catch (error) {
      if (checkAndHandleQuotaError(error)) return;
      logError('Error saving user profile to Firestore:', error);
      throw error;
    }
  };

  if (immediate) {
    if (profileSaveTimeout) {
      clearTimeout(profileSaveTimeout);
      profileSaveTimeout = null;
    }
    await executeSave();
  } else {
    if (profileSaveTimeout) {
      clearTimeout(profileSaveTimeout);
    }
    profileSaveTimeout = setTimeout(executeSave, 2000);
  }
};

// Subscribe to User Profile in Firestore for live real-time synchronization
export const subscribeToUserProfile = (userId: string, callback: (profile: Partial<UserProfile>) => void) => {
  if (!userId || userId.startsWith('guest')) return () => {};
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef, 
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const pts = data.points || 0;
        const levelInfo = getLevelDetails(pts);
        
        callback({
          id: userId,
          email: data.email || undefined,
          username: data.username || 'משתמש רשום',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          age: data.age || undefined,
          title: levelInfo.title,
          level: levelInfo.level,
          points: pts,
          coins: data.coins || 0,
          avatarIcon: (data.avatarIcon || '/player-icons/shofar.png').replace('/avatars/', '/player-icons/'),
          avatarBg: data.avatarBg || 'from-amber-500 to-amber-700',
          joinedDate: data.joinedDate || new Date().toLocaleDateString('he-IL'),
          favoriteGameIds: Array.isArray(data.favoriteGameIds) ? data.favoriteGameIds : [],
          badges: Array.isArray(data.badges) ? data.badges : [],
          gameStats: data.gameStats || {},
          bio: data.bio || 'שוקד על דברי תורה וערכים בקניגיים.',
          shabbatModeEnabled: data.shabbatModeEnabled ?? false,
          soundEnabled: data.soundEnabled ?? true,
          isAdmin: data.isAdmin ?? false,
        });
      }
    },
    (error) => {
      checkAndHandleQuotaError(error);
    }
  );
};

// Auth methods
export const loginWithEmail = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const registerWithEmail = (email: string, pass: string) => {
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const loginWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const logout = () => {
  return signOut(auth);
};

export const resetPassword = async (email: string) => {
  try {
    const sendCustomPasswordResetEmail = httpsCallable(functions, 'sendCustomPasswordResetEmail');
    await sendCustomPasswordResetEmail({ email });
  } catch (err: any) {
    // Fallback to standard Firebase reset if Cloud Function fails or isn't deployed yet
    console.warn('Custom password reset failed, falling back to standard Firebase reset', err);
    return sendPasswordResetEmail(auth, email, {
      url: typeof window !== 'undefined' ? window.location.origin : 'https://qnigame.com'
    });
  }
};

// ==========================================
// GAME COMMENTS FIRESTORE INTEGRATION
// ==========================================

/**
 * Subscribe to live game comments in Firestore for a given game
 */
export const subscribeToGameComments = (
  gameId: string,
  callback: (comments: GameComment[]) => void
) => {
  if (!gameId) return () => {};
  try {
    const commentsRef = collection(db, 'gameComments');
    const q = query(
      commentsRef,
      where('gameId', '==', gameId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        const list: GameComment[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            gameId: data.gameId || gameId,
            userId: data.userId,
            userName: data.userName || 'שחקן',
            userAvatar: (data.userAvatar || '/player-icons/shofar.png').replace('/avatars/', '/player-icons/'),
            userTitle: data.userTitle || 'לומד תורה',
            rating: data.rating || 5,
            content: data.content || '',
            timestamp: data.timestamp || 'מקרוב',
            likes: data.likes || 0,
            likedBy: data.likedBy || [],
          };
        });
        callback(list);
      },
      (error) => {
        checkAndHandleQuotaError(error);
      }
    );
  } catch (err) {
    logError('Error setting up comments snapshot:', err);
    return () => {};
  }
};

/**
 * Subscribe to news articles from Firestore
 */
export const subscribeToNewsArticles = (
  isAdmin: boolean,
  callback: (articles: NewsArticle[]) => void
) => {
  if (isQuotaExceeded) {
    console.warn('News sync skipped due to quota limits.');
    return () => {};
  }
  
  try {
    const newsRef = collection(db, 'newsArticles');
    const q = isAdmin 
      ? query(newsRef, orderBy('createdAt', 'desc'))
      : query(newsRef, where('isAdminOnly', '==', false), orderBy('createdAt', 'desc'));
    
    return onSnapshot(
      q,
      (snap) => {
        const list: NewsArticle[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
            date: data.date || '',
            author: data.author || 'מערכת משחקי קודש',
            category: data.category || 'עדכוני משחקים',
            readTime: data.readTime || '3 דק׳',
            imageUrl: data.imageUrl,
            mediaType: data.mediaType,
            mediaUrl: data.mediaUrl,
            linkUrl: data.linkUrl,
            likes: data.likes || 0,
            likedBy: data.likedBy || [],
            commentsCount: data.commentsCount || 0,
            tags: data.tags || [],
            isAdminOnly: data.isAdminOnly || false,
            isFeatured: data.isFeatured || false,
          };
        });
        callback(list);
      },
      (error) => {
        checkAndHandleQuotaError(error);
      }
    );
  } catch (err) {
    logError('Error setting up news snapshot:', err);
    return () => {};
  }
};

/**
 * Toggle like for a news article
 */
export const toggleNewsArticleLike = async (articleId: string, userId: string) => {
  if (!articleId || !userId || isQuotaExceeded) return;
  try {
    const articleRef = doc(db, 'newsArticles', articleId);
    
    const articleDoc = await getDoc(articleRef);
    if (!articleDoc.exists()) return;
    
    const data = articleDoc.data();
    const likedBy: string[] = data.likedBy || [];
    const hasLiked = likedBy.includes(userId);
    
    await updateDoc(articleRef, {
      likedBy: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
      likes: hasLiked ? Math.max(0, (data.likes || 1) - 1) : increment(1)
    });
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return;
    logError('Error toggling news article like:', error);
  }
};

/**
 * Add like for a news article (used when merging guest likes upon login)
 */
export const addNewsArticleLike = async (articleId: string, userId: string) => {
  if (!articleId || !userId || isQuotaExceeded) return;
  try {
    const articleRef = doc(db, 'newsArticles', articleId);
    
    const articleDoc = await getDoc(articleRef);
    if (!articleDoc.exists()) return;
    
    const data = articleDoc.data();
    const likedBy: string[] = data.likedBy || [];
    if (likedBy.includes(userId)) return; // Already liked
    
    await updateDoc(articleRef, {
      likedBy: arrayUnion(userId),
      likes: increment(1)
    });
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return;
    logError('Error adding news article like:', error);
  }
};

/**
 * Admin: Create a new news article
 */
/**
 * Admin: Get all users from Firestore
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(1000)); 
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      ...doc.data(),
      userId: doc.id
    })) as unknown as UserProfile[];
  } catch (error) {
    logError('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Admin: Toggle user status (disable/enable)
 */
export const toggleUserStatus = async (targetUid: string, disabled: boolean): Promise<void> => {
  try {
    const functions = getFunctions();
    const adminToggleUserStatus = httpsCallable(functions, 'adminToggleUserStatus');
    await adminToggleUserStatus({ targetUid, disabled });
  } catch (error) {
    logError('Error toggling user status:', error);
    throw error;
  }
};

/**
 * Admin: Delete user account
 */
export const deleteUserAccount = async (targetUid: string): Promise<void> => {
  try {
    const functions = getFunctions();
    const adminDeleteUser = httpsCallable(functions, 'adminDeleteUser');
    await adminDeleteUser({ targetUid });
  } catch (error) {
    logError('Error deleting user account:', error);
    throw error;
  }
};

export const createNewsArticle = async (articleData: Partial<NewsArticle>) => {
  if (isQuotaExceeded) throw new Error("Quota exceeded");
  const newsRef = collection(db, 'newsArticles');
  const docRef = doc(newsRef);
  const newArticle = {
    ...articleData,
    id: docRef.id,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedBy: [],
    commentsCount: 0,
    isAdminOnly: articleData.isAdminOnly || false,
  };
  await setDoc(docRef, newArticle);
  return newArticle;
};

/**
 * Admin: Update a news article
 */
export const updateNewsArticle = async (articleId: string, articleData: Partial<NewsArticle>) => {
  if (!articleId || isQuotaExceeded) throw new Error("Invalid ID or Quota exceeded");
  const articleRef = doc(db, 'newsArticles', articleId);
  const cleanData = Object.fromEntries(Object.entries(articleData).filter(([_, v]) => v !== undefined));
  await updateDoc(articleRef, cleanData);
};

/**
 * Admin: Delete a news article
 */
export const deleteNewsArticle = async (articleId: string) => {
  if (!articleId || isQuotaExceeded) throw new Error("Invalid ID or Quota exceeded");
  const articleRef = doc(db, 'newsArticles', articleId);
  await deleteDoc(articleRef);
};

// ==========================================
// ADMIN: GAME MANAGEMENT
// ==========================================

export const createGame = async (gameData: Partial<Game>) => {
  if (isQuotaExceeded) throw new Error("Quota exceeded");
  const gamesRef = collection(db, 'games');
  const docRef = doc(gamesRef);
  const newGame = {
    ...gameData,
    id: docRef.id,
    plays: 0,
    rating: 5,
    comments: [],
  };
  const cleanData = Object.fromEntries(Object.entries(newGame).filter(([_, v]) => v !== undefined));
  await setDoc(docRef, cleanData);
  return cleanData as Game;
};

export const updateGame = async (gameId: string, gameData: Partial<Game>) => {
  if (!gameId || isQuotaExceeded) throw new Error("Invalid ID or Quota exceeded");
  const gameRef = doc(db, 'games', gameId);
  const cleanData = Object.fromEntries(Object.entries(gameData).filter(([_, v]) => v !== undefined));
  await setDoc(gameRef, cleanData, { merge: true });
};

export const deleteGame = async (gameId: string) => {
  if (!gameId || isQuotaExceeded) throw new Error("Invalid ID or Quota exceeded");
  const gameRef = doc(db, 'games', gameId);
  await deleteDoc(gameRef);
};


/**
 * Add a new comment for a game to Firestore
 */
export const addGameCommentToFirestore = async (
  commentData: Omit<GameComment, 'id'>
) => {
  if (isQuotaExceeded) {
    console.warn('Comment creation skipped due to quota limits.');
    return 'local-comment-id';
  }
  try {
    const commentsRef = collection(db, 'gameComments');
    const docData = cleanFirestoreData({
      ...commentData,
      createdAt: new Date().toISOString(),
    });

    const q = query(
      commentsRef,
      where('gameId', '==', commentData.gameId),
      where('userId', '==', commentData.userId)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const existingDoc = snap.docs[0];
      await setDoc(existingDoc.ref, docData, { merge: true });
      return existingDoc.id;
    } else {
      const docRef = await addDoc(commentsRef, docData);
      return docRef.id;
    }
  } catch (error) {
    if (checkAndHandleQuotaError(error)) {
      return 'local-comment-id';
    }
    logError('Error adding comment to Firestore:', error);
    throw error;
  }
};

/**
 * Delete a comment from Firestore
 */
export const deleteGameCommentFromFirestore = async (commentId: string) => {
  if (isQuotaExceeded) {
    console.warn('Comment deletion skipped due to quota limits.');
    return;
  }
  try {
    const commentRef = doc(db, 'gameComments', commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return;
    logError('Error deleting comment from Firestore:', error);
    throw error;
  }
};

/**
 * Increment likes count for a comment in Firestore (only once per user)
 */
export const likeGameCommentInFirestore = async (
  commentId: string,
  userId: string,
  isLike: boolean = true
) => {
  if (isQuotaExceeded || !userId) return;
  try {
    const commentRef = doc(db, 'gameComments', commentId);
    const snap = await getDoc(commentRef);
    if (!snap.exists()) return;
    
    const data = snap.data();
    let likedBy: string[] = data.likedBy || [];
    
    if (isLike && !likedBy.includes(userId)) {
      likedBy.push(userId);
      await setDoc(commentRef, { 
        likes: (data.likes || 0) + 1,
        likedBy: likedBy
      }, { merge: true });
    } else if (!isLike && likedBy.includes(userId)) {
      likedBy = likedBy.filter(id => id !== userId);
      await setDoc(commentRef, {
        likes: Math.max(0, (data.likes || 0) - 1),
        likedBy: likedBy
      }, { merge: true });
    }
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return;
    logError('Error updating comment likes in Firestore:', error);
  }
};

// ==========================================
// GENERIC GAME PROGRESS SAVE STATE FIRESTORE
// ==========================================

let progressSaveTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * Save generic progressData JSON for a given userId and gameId in Firestore
 * (Debounced & optimized to single doc write)
 */
/**
 * Load global shared JSON data for a specific game (e.g. shared dictionary)
 */
export const getGameGlobalData = async (gameId: string): Promise<any> => {
  if (!gameId || isQuotaExceeded) return null;
  try {
    const docRef = doc(db, 'gameGlobalData', gameId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().data || null;
    }
    return null;
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return null;
    logError('Error fetching global game data:', error);
    return null;
  }
};

/**
 * Update global shared JSON data for a specific game
 */
export const updateGameGlobalData = async (gameId: string, data: any): Promise<void> => {
  if (!gameId || isQuotaExceeded) return;
  try {
    const docRef = doc(db, 'gameGlobalData', gameId);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return;
    logError('Error updating global game data:', error);
  }
};

/**
 * Save user game progress data (per user JSON)
 */
export const saveGameProgressToFirestore = async (
  userId: string,
  gameId: string,
  progressData: any
) => {
  if (!userId || userId.startsWith('guest') || !gameId) return;
  if (isQuotaExceeded) return;

  const saveKey = `${userId}_${gameId}`;
  if (progressSaveTimeouts[saveKey]) {
    clearTimeout(progressSaveTimeouts[saveKey]);
  }

  progressSaveTimeouts[saveKey] = setTimeout(async () => {
    delete progressSaveTimeouts[saveKey];
    if (isQuotaExceeded) return;

    try {
      const updatedAt = new Date().toISOString();
      const serializedProgress = typeof progressData === 'object' ? JSON.stringify(progressData) : progressData;

      // 1 consolidated write under /users/{userId}/game_saves/{gameId}
      const saveRef = doc(db, 'users', userId, 'game_saves', gameId);
      await setDoc(saveRef, {
        userId,
        gameId,
        progressData: serializedProgress,
        updatedAt,
      }, { merge: true });
    } catch (error) {
      if (checkAndHandleQuotaError(error)) return;
      logError(`Error saving game progress for gameId=${gameId}:`, error);
    }
  }, 2000);
};

/**
 * Get generic progressData JSON for a given userId and gameId from Firestore
 */
export const getGameProgressFromFirestore = async (
  userId: string,
  gameId: string
): Promise<any> => {
  if (!userId || userId.startsWith('guest') || !gameId) return null;

  try {
    const saveRef = doc(db, 'users', userId, 'game_saves', gameId);
    const snap = await getDoc(saveRef);
    if (snap.exists()) {
      return snap.data().progressData || null;
    }

    const standaloneRef = doc(db, 'user_game_saves', `${userId}_${gameId}`);
    const standaloneSnap = await getDoc(standaloneRef);
    if (standaloneSnap.exists()) {
      return standaloneSnap.data().progressData || null;
    }

    return null;
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return null;
    logError(`Error loading game progress for gameId=${gameId}:`, error);
    return null;
  }
};

// ==========================================
// PUBLIC LEADERBOARD FIRESTORE INTEGRATION
// ==========================================

export interface LeaderboardEntry {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  title: string;
  level: number;
  points: number;
  avatarIcon: string;
  badgeCount: number;
  playsCount: number;
  updatedAt?: string;
}

/**
  * Update public leaderboard entry for user in Firestore (/leaderboard/{userId})
  */
export const updateLeaderboardEntry = async (userProfile: UserProfile) => {
  if (!userProfile.id || userProfile.id.startsWith('user-1') || userProfile.id.startsWith('guest')) {
    return;
  }
  if (isQuotaExceeded) return;

  try {
    const leaderboardRef = doc(db, 'leaderboard', userProfile.id);
    const badgeCount = Array.isArray(userProfile.badges)
      ? userProfile.badges.filter(b => b.unlocked).length
      : 0;
    const playsCount = userProfile.gameStats
      ? Object.values(userProfile.gameStats as Record<string, { playsCount: number }>).reduce((acc, s) => acc + (s.playsCount || 0), 0)
      : 0;

    const levelInfo = getLevelDetails(userProfile.points || 0);

    const entryData = cleanFirestoreData({
      id: userProfile.id,
      userId: userProfile.id,
      username: userProfile.username || 'שחקן',
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
      title: levelInfo.title,
      level: levelInfo.level,
      points: userProfile.points || 0,
      avatarIcon: (userProfile.avatarIcon || '/player-icons/shofar.png').replace('/avatars/', '/player-icons/'),
      badgeCount,
      playsCount,
      gameStats: userProfile.gameStats || {},
      updatedAt: new Date().toISOString()
    });
    await setDoc(leaderboardRef, entryData, { merge: true });
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return;
    logError('Error updating leaderboard entry in Firestore:', error);
  }
};

/**
  * Subscribe to live leaderboard collection sorted by points in Firestore
  */
export const subscribeToLeaderboard = (
  callback: (entries: LeaderboardEntry[]) => void,
  limitCount = 50
) => {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, orderBy('points', 'desc'), limit(limitCount));
    return onSnapshot(
      q,
      (snap) => {
        const list: LeaderboardEntry[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            username: data.username || 'שחקן',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            title: data.title || 'תלמיד חכם',
            level: data.level || 1,
            points: data.points || 0,
            avatarIcon: (data.avatarIcon || '/player-icons/shofar.png').replace('/avatars/', '/player-icons/'),
            badgeCount: data.badgeCount || 0,
            playsCount: data.playsCount || 0,
            updatedAt: data.updatedAt,
            isCurrentUser: false
          };
        });
        callback(list);
      },
      (error) => {
        checkAndHandleQuotaError(error);
      }
    );
  } catch (err) {
    logError('Error setting up leaderboard snapshot:', err);
    return () => {};
  }
};

/**
  * Subscribe to a specific game's leaderboard
  */
export const subscribeToGameLeaderboard = (
  gameId: string,
  callback: (entries: LeaderboardEntry[]) => void,
  limitCount = 10
) => {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef);
    return onSnapshot(
      q,
      (snap) => {
        let list: LeaderboardEntry[] = [];
        
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const highScore = data.gameStats?.[gameId]?.highScore || 0;
          
          if (highScore > 0) {
            list.push({
              id: docSnap.id,
              username: data.username || 'שחקן',
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              title: data.title || 'תלמיד חכם',
              level: data.level || 1,
              points: highScore,
              avatarIcon: (data.avatarIcon || '/player-icons/shofar.png').replace('/avatars/', '/player-icons/'),
              badgeCount: data.badgeCount || 0,
              playsCount: data.gameStats?.[gameId]?.playsCount || 0
            });
          }
        });
        
        // Sort descending locally and slice
        list.sort((a, b) => b.points - a.points);
        callback(limitCount > 0 ? list.slice(0, limitCount) : list);
      },
      (error) => {
        checkAndHandleQuotaError(error);
      }
    );
  } catch (error) {
    logError('Error setting up game leaderboard subscription:', error);
    return () => {};
  }
};

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

export const migrateAvatarsInDB = async () => {
  log("Starting DB migration for avatars...");
  let count = 0;
  
  // 1. Users
  const usersRef = collection(db, 'users');
  const userSnap = await getDocs(usersRef);
  for (const d of userSnap.docs) {
    const data = d.data();
    if (data.avatarIcon && !data.avatarIcon.startsWith('/')) {
      const newAvatar = EMOJI_TO_IMAGE[data.avatarIcon] || '/player-icons/shofar.png';
      await updateDoc(doc(db, 'users', d.id), { avatarIcon: newAvatar });
      count++;
    }
  }

  // 2. Leaderboard
  const lbRef = collection(db, 'leaderboard');
  const lbSnap = await getDocs(lbRef);
  for (const d of lbSnap.docs) {
    const data = d.data();
    if (data.avatarIcon && !data.avatarIcon.startsWith('/')) {
      const newAvatar = EMOJI_TO_IMAGE[data.avatarIcon] || '/player-icons/shofar.png';
      await updateDoc(doc(db, 'leaderboard', d.id), { avatarIcon: newAvatar });
      count++;
    }
  }

  // 3. Game Comments
  const gamesRef = collection(db, 'games');
  const gamesSnap = await getDocs(gamesRef);
  for (const gameDoc of gamesSnap.docs) {
    const data = gameDoc.data();
    if (data.comments && Array.isArray(data.comments)) {
      let needsUpdate = false;
      const newComments = data.comments.map((c: any) => {
        if (c.userAvatar && !c.userAvatar.startsWith('/')) {
          needsUpdate = true;
          return {
            ...c,
            userAvatar: EMOJI_TO_IMAGE[c.userAvatar] || '/player-icons/shofar.png'
          };
        }
        return c;
      });
      if (needsUpdate) {
        await updateDoc(doc(db, 'games', gameDoc.id), { comments: newComments });
        count++;
      }
    }
  }
  
  log("DB migration completed! Updated " + count + " documents.");
  return count;
};

/**
 * Subscribe to global settings (like maintenance mode)
 */
export const subscribeToGlobalSettings = (callback: (settings: { isMaintenanceMode?: boolean, isMonetizationEnabled?: boolean }) => void) => {
  if (isQuotaExceeded) {
    callback({ isMaintenanceMode: false, isMonetizationEnabled: true });
    return () => {};
  }
  try {
    // We use the newsArticles collection to store settings because it already has 
    // the correct Firebase Security Rules (read for all, write for admins)
    const settingsRef = doc(db, 'newsArticles', '_SYSTEM_SETTINGS_');
    return onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as { isMaintenanceMode?: boolean, isMonetizationEnabled?: boolean });
        } else {
          callback({});
        }
      },
      (error) => {
        checkAndHandleQuotaError(error);
        logError('Settings snapshot error:', error);
        callback({ isMaintenanceMode: false, isMonetizationEnabled: true }); // Unblock on error
      }
    );
  } catch (err) {
    logError('Error setting up settings snapshot:', err);
    callback({ isMaintenanceMode: false, isMonetizationEnabled: true });
    return () => {};
  }
};

/**
 * Update maintenance mode status
 */
export const setMaintenanceMode = async (isEnabled: boolean) => {
  if (isQuotaExceeded) return;
  const settingsRef = doc(db, 'newsArticles', '_SYSTEM_SETTINGS_');
  try {
    await setDoc(settingsRef, { 
      isMaintenanceMode: isEnabled,
      isAdminOnly: false,
    }, { merge: true });
  } catch (err) {
    logError('Error updating maintenance mode:', err);
    throw err;
  }
};

/**
 * Update global monetization mode
 */
export const setMonetizationMode = async (isEnabled: boolean) => {
  if (isQuotaExceeded) return;
  const settingsRef = doc(db, 'newsArticles', '_SYSTEM_SETTINGS_');
  try {
    await setDoc(settingsRef, { 
      isMonetizationEnabled: isEnabled,
      isAdminOnly: false,
    }, { merge: true });
  } catch (err) {
    logError('Error updating monetization mode:', err);
    throw err;
  }
};

/**
 * Admin: Toggle user VIP status (disable/enable free access)
 */
export const adminToggleUserVipStatus = async (targetUid: string, isVip: boolean): Promise<void> => {
  try {
    const functions = getFunctions();
    const toggleVip = httpsCallable(functions, 'adminToggleUserVipStatus');
    await toggleVip({ targetUid, isVip });
  } catch (error) {
    logError('Error toggling VIP status:', error);
    throw error;
  }
};
