import * as admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'molten-protocol-whnbb'
});

async function main() {
  const db = admin.firestore();
  const uid = 'sYkJPtQJpLgKHalGaUeGPhsSvVC2';
  
  await db.collection('users').doc(uid).set({
    username: 'Admin (Restored)',
    email: 'dancohen180294@gmail.com', // Best guess based on logs
    isAdmin: true,
    points: 1000,
    disabled: false,
    joinedDate: new Date().toLocaleDateString('he-IL')
  }, { merge: true });
  
  console.log(`Successfully restored admin status for user: ${uid}`);
}

main().catch(console.error);
