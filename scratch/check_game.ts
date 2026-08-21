import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' assert { type: "json" };

const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function checkGame() {
  console.log('Fetching public games to find "אילן יוחסין"...');
  const gamesRef = collection(db, 'games');
  const q = query(gamesRef, where('isAdminOnly', '==', false));
  
  try {
    const snap = await getDocs(q);
    let found = false;
    snap.forEach(doc => {
      const data = doc.data();
      if (data.title && data.title.includes('יוחסין')) {
        console.log(`Found Game ID: ${doc.id}`);
        console.log(JSON.stringify(data, null, 2));
        found = true;
      }
    });
    
    if (!found) {
      console.log('Game not found in public games. Checking admin only games...');
      // If it fails, we need admin credentials, but we can't do that easily without a service account.
    }
  } catch (err) {
    console.error('Error fetching games:', err);
  }
}

checkGame().catch(console.error);
