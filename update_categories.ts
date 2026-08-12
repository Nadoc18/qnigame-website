import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read config locally
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig;
try {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  // fallback to env vars or something if needed, but we should have this file in the workspace
  console.error("Could not read firebase-applet-config.json", e);
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function migrateCategories() {
  console.log("Starting migration for Categories...");

  const categoryMap: Record<string, string> = {
    'תנ"ך ומורשת': 'תנ"ך',
    'ברכות והלכה': 'הלכה',
    'טריוויה ודעת': 'טריוויה',
    'חשיבה ופאזל': 'חשיבה',
  };

  const gamesRef = collection(db, 'games');
  const gamesSnap = await getDocs(gamesRef);
  for (const docSnap of gamesSnap.docs) {
    const data = docSnap.data();
    if (data.category && categoryMap[data.category]) {
      const newCat = categoryMap[data.category];
      console.log(`Updating game ${docSnap.id}: ${data.category} -> ${newCat}`);
      await setDoc(doc(db, 'games', docSnap.id), { category: newCat }, { merge: true });
    }
  }

  console.log("Migration complete!");
}

migrateCategories().catch(console.error);
