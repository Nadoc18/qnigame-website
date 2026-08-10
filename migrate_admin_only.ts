import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// Read config locally
const configPath = './firebase-applet-config.json';
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function migrate() {
  console.log("Starting migration for isAdminOnly...");

  // Migrate newsArticles
  const newsRef = collection(db, 'newsArticles');
  const newsSnap = await getDocs(newsRef);
  for (const docSnap of newsSnap.docs) {
    const data = docSnap.data();
    if (data.isAdminOnly === undefined) {
      console.log(`Updating news article: ${docSnap.id}`);
      await setDoc(doc(db, 'newsArticles', docSnap.id), { isAdminOnly: false }, { merge: true });
    }
  }

  // Migrate games
  const gamesRef = collection(db, 'games');
  const gamesSnap = await getDocs(gamesRef);
  for (const docSnap of gamesSnap.docs) {
    const data = docSnap.data();
    if (data.isAdminOnly === undefined) {
      console.log(`Updating game: ${docSnap.id}`);
      await setDoc(doc(db, 'games', docSnap.id), { isAdminOnly: false }, { merge: true });
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
