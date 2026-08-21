import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' assert { type: "json" };

const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function testIncrement() {
  const gameId = 'tanach-wordle-game';
  console.log(`Testing increment for game ID: ${gameId}`);
  try {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      playCount: increment(1),
      totalTimePlayed: increment(10)
    });
    console.log('Increment succeeded!');
  } catch (err) {
    console.error('Increment failed:', err);
  }
}

testIncrement().catch(console.error);
