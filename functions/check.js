const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore(undefined, 'ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4');

async function checkEmails() {
  try {
    const snapshot = await db.collection('mail').get();
    
    if (snapshot.empty) {
      console.log('No documents found in the mail collection in the ai-studio database.');
      return;
    }
    
    snapshot.forEach(doc => {
      console.log(`Document ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('---------------------------');
    });
  } catch (err) {
    console.error('Error checking firestore:', err);
  }
}

checkEmails().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
