import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import * as fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('functions/service-account.json', 'utf8'));

if (require('firebase-admin/app').getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore('ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4');

async function checkSaves() {
  const usersRef = db.collection('users');
  const usersSnap = await usersRef.limit(10).get();
  
  for (const userDoc of usersSnap.docs) {
    const savesRef = db.collection('users').doc(userDoc.id).collection('game_saves');
    const savesSnap = await savesRef.get();
    
    if (!savesSnap.empty) {
      console.log(`\nUser: ${userDoc.id} (${userDoc.data().username})`);
      for (const saveDoc of savesSnap.docs) {
        console.log(`- Save [${saveDoc.id}]:`, saveDoc.data());
      }
    }
  }
}

checkSaves().catch(console.error);
