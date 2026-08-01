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
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Game } from '../types';

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

// Sync / Save a game document directly to Firestore
export const syncGameToFirestore = async (game: Game): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', game.id);
    await setDoc(gameRef, game, { merge: true });
  } catch (error) {
    console.warn(`Error syncing game ${game.id} to Firestore:`, error);
  }
};

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
    console.warn('Error fetching games from Firestore, falling back to local list:', error);
    return [];
  }
};

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
      bio: 'ברוך הבא לקניגיים! שוקד על תורה וערכים.',
      shabbatModeEnabled: false,
      soundEnabled: true,
    };

    await setDoc(userRef, {
      ...newProfile,
      uid: firebaseUser.uid,
      updatedAt: new Date().toISOString()
    });

    return newProfile;
  }
};

// Save User Profile to Firestore & Qnigame Domain API
export const saveUserProfileToFirestore = async (userProfile: UserProfile) => {
  if (!userProfile.id || userProfile.id.startsWith('user-1') || userProfile.id.startsWith('guest')) {
    // Local / Guest user - don't save or return early
    return;
  }
  try {
    const userRef = doc(db, 'users', userProfile.id);
    await setDoc(userRef, {
      ...userProfile,
      uid: userProfile.id,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // C'EST ICI QUE VOUS COMMENTEZ LE CODE :
    // Also sync to domain API endpoint seamlessly
    /* 
    fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userProfile.id,
        username: userProfile.username,
        points: userProfile.points,
        coins: userProfile.coins,
        favoriteGameIds: userProfile.favoriteGameIds
      })
    }).catch(e => console.warn('Domain API user sync:', e)); 
    */
    
  } catch (error) {
    console.error('Error saving user profile to cloud storage:', error);
  }
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
