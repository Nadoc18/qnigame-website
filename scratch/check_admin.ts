import * as admin from 'firebase-admin';

// Initialize with default credentials
admin.initializeApp({
  projectId: 'molten-protocol-whnbb'
});

async function main() {
  const db = admin.firestore();
  
  // Find all admins
  const usersSnapshot = await db.collection('users').get();
  let adminFound = false;
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    if (data.isAdmin === true || data.isAdmin === 'true') {
      console.log(`User ${doc.id} is Admin:`, data.isAdmin, typeof data.isAdmin, 'Email:', data.email);
      adminFound = true;
    }
  }
  
  if (!adminFound) {
    console.log("No admins found!");
  }
}

main().catch(console.error);
