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
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Game, GameComment } from '../types';

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Fetch games list from Firestore (single read call)
export const getGamesFromFirestore = async (): Promise<Game[]> => {
  const gamesPath = 'games';
  try {
    const snap = await getDocs(collection(db, gamesPath));
    const games: Game[] = [];
    snap.forEach((d) => {
      const data = d.data() as Game;
      games.push({
        id: d.id,
        ...data
      });
    });
    return games;
  } catch (error) {
    console.warn('Error fetching games from Firestore:', error);
    return [];
  }
};

/**
 * Helper to strip `undefined` values from an object before sending to Firestore,
 * as Firestore throws an error if any field value is `undefined`.
 */
function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
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
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      username: data.username || firebaseUser.displayName || 'משתמש רשום',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      age: data.age || undefined,
      title: data.title || 'תלמיד חכם',
      level: data.level || 1,
      points: data.points || 0,
      coins: data.coins || 0,
      avatarIcon: data.avatarIcon || '🎓',
      avatarBg: data.avatarBg || 'from-amber-500 to-amber-700',
      joinedDate: data.joinedDate || new Date().toLocaleDateString('he-IL'),
      favoriteGameIds: Array.isArray(data.favoriteGameIds) ? data.favoriteGameIds : [],
      badges: Array.isArray(data.badges) ? data.badges : (defaultInitialUser?.badges || []),
      gameStats: data.gameStats || (defaultInitialUser?.gameStats || {}),
      gameProgress: data.gameProgress || {},
      bio: data.bio || 'שוקד על דברי תורה וערכים בקניגיים.',
      shabbatModeEnabled: data.shabbatModeEnabled ?? false,
      soundEnabled: data.soundEnabled ?? true,
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
      avatarIcon: '🎓',
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

    return newProfile;
  }
};

// Save User Profile to Firestore
export const saveUserProfileToFirestore = async (userProfile: UserProfile) => {
  if (!userProfile.id || userProfile.id.startsWith('user-1') || userProfile.id.startsWith('guest')) {
    // Local / Guest user - don't save to cloud
    return;
  }
  try {
    const userRef = doc(db, 'users', userProfile.id);
    const docData = cleanFirestoreData({
      ...userProfile,
      uid: userProfile.id,
      updatedAt: new Date().toISOString()
    });
    await setDoc(userRef, docData, { merge: true });
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
  }
};

// Subscribe to User Profile in Firestore for live real-time synchronization
export const subscribeToUserProfile = (userId: string, callback: (profile: Partial<UserProfile>) => void) => {
  if (!userId || userId.startsWith('guest')) return () => {};
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({
        id: userId,
        email: data.email || undefined,
        username: data.username || 'משתמש רשום',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        age: data.age || undefined,
        title: data.title || 'תלמיד חכם',
        level: data.level || 1,
        points: data.points || 0,
        coins: data.coins || 0,
        avatarIcon: data.avatarIcon || '🎓',
        avatarBg: data.avatarBg || 'from-amber-500 to-amber-700',
        joinedDate: data.joinedDate || new Date().toLocaleDateString('he-IL'),
        favoriteGameIds: Array.isArray(data.favoriteGameIds) ? data.favoriteGameIds : [],
        badges: Array.isArray(data.badges) ? data.badges : [],
        gameStats: data.gameStats || {},
        gameProgress: data.gameProgress || {},
        bio: data.bio || 'שוקד על דברי תורה וערכים בקניגיים.',
        shabbatModeEnabled: data.shabbatModeEnabled ?? false,
        soundEnabled: data.soundEnabled ?? true,
      });
    }
  });
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

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
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
            userAvatar: data.userAvatar || '🎓',
            userTitle: data.userTitle || 'לומד תורה',
            rating: data.rating || 5,
            content: data.content || '',
            timestamp: data.timestamp || 'מקרוב',
            likes: data.likes || 0,
          };
        });
        callback(list);
      },
      (error) => {
        console.warn('Firestore gameComments subscription note:', error);
      }
    );
  } catch (err) {
    console.error('Error setting up comments snapshot:', err);
    return () => {};
  }
};

/**
 * Add a new comment for a game to Firestore
 */
export const addGameCommentToFirestore = async (
  commentData: Omit<GameComment, 'id'>
) => {
  try {
    const commentsRef = collection(db, 'gameComments');
    const docData = cleanFirestoreData({
      ...commentData,
      createdAt: new Date().toISOString(),
    });
    const docRef = await addDoc(commentsRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment to Firestore:', error);
    throw error;
  }
};

/**
 * Increment likes count for a comment in Firestore
 */
export const likeGameCommentInFirestore = async (
  commentId: string,
  currentLikes: number
) => {
  try {
    const commentRef = doc(db, 'gameComments', commentId);
    await setDoc(commentRef, { likes: currentLikes + 1 }, { merge: true });
  } catch (error) {
    console.error('Error updating comment likes in Firestore:', error);
  }
};
