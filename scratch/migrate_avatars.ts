import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const EMOJI_TO_IMAGE: Record<string, string> = {
  '🎓': '/avatars/shofar.jpg',
  '✡️': '/avatars/torah.jpg',
  '🕍': '/avatars/kippa.jpg',
  '📜': '/avatars/siddur.jpg',
  '🦁': '/avatars/dreidel.jpg',
  '👑': '/avatars/rimon.jpg',
  '🕎': '/avatars/shofar.jpg',
  '🕯️': '/avatars/shofar.jpg',
  '🍷': '/avatars/tallit.jpg',
  '🍯': '/avatars/tzedakah.jpg',
  '✡': '/avatars/torah.jpg'
};

async function migrateAvatars() {
  console.log("Starting avatar migration...");
  
  // 1. Migrate Users
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  let updatedCount = 0;

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    if (data.avatarIcon && !data.avatarIcon.startsWith('/')) {
      const oldAvatar = data.avatarIcon;
      const newAvatar = EMOJI_TO_IMAGE[oldAvatar] || '/avatars/shofar.jpg';
      console.log(`Updating user ${userDoc.id}: ${oldAvatar} -> ${newAvatar}`);
      await updateDoc(doc(db, 'users', userDoc.id), {
        avatarIcon: newAvatar
      });
      updatedCount++;
    }
  }
  
  // 2. Migrate Leaderboard entries
  const lbRef = collection(db, 'leaderboard');
  const lbSnap = await getDocs(lbRef);
  let lbCount = 0;
  for (const lbDoc of lbSnap.docs) {
    const data = lbDoc.data();
    if (data.avatarIcon && !data.avatarIcon.startsWith('/')) {
      const oldAvatar = data.avatarIcon;
      const newAvatar = EMOJI_TO_IMAGE[oldAvatar] || '/avatars/shofar.jpg';
      await updateDoc(doc(db, 'leaderboard', lbDoc.id), {
        avatarIcon: newAvatar
      });
      lbCount++;
    }
  }
  
  // 3. Migrate Comments within Games
  const gamesRef = collection(db, 'games');
  const gamesSnap = await getDocs(gamesRef);
  let gamesCount = 0;
  for (const gameDoc of gamesSnap.docs) {
    const data = gameDoc.data();
    if (data.comments && Array.isArray(data.comments)) {
      let needsUpdate = false;
      const newComments = data.comments.map((c: any) => {
        if (c.userAvatar && !c.userAvatar.startsWith('/')) {
          needsUpdate = true;
          return {
            ...c,
            userAvatar: EMOJI_TO_IMAGE[c.userAvatar] || '/avatars/shofar.jpg'
          };
        }
        return c;
      });
      if (needsUpdate) {
        await updateDoc(doc(db, 'games', gameDoc.id), {
          comments: newComments
        });
        gamesCount++;
      }
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} users, ${lbCount} leaderboard entries, and ${gamesCount} games (comments).`);
  process.exit(0);
}

migrateAvatars().catch(console.error);
