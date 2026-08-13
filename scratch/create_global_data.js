const admin = require('firebase-admin');
const serviceAccount = require('../functions/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
// IMPORTANT: utiliser la base nommée, pas la (default)
db.settings({ databaseId: 'ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4' });

async function createGlobalData() {
  // Exemple : créer un document pour le jeu "time-count"
  // Change l'ID et le contenu selon ton besoin
  const gameId = 'time-count';
  const globalData = {
    words: ["שבת", "תורה", "מצווה", "ברכה", "תפילה"]
  };

  await db.collection('gameGlobalData').doc(gameId).set({
    data: globalData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Document créé dans gameGlobalData/${gameId}`);
  console.log('Contenu:', JSON.stringify(globalData, null, 2));
  process.exit(0);
}

createGlobalData().catch((err) => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
