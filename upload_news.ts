import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load Firebase Config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Use the local static data file
import { NEWS_ARTICLES } from './src/data/newsData';

async function uploadNews() {
  console.log(`Starting upload of ${NEWS_ARTICLES.length} news articles...`);

  let successCount = 0;
  for (const article of NEWS_ARTICLES) {
    try {
      const docRef = doc(db, 'newsArticles', article.id);
      
      // Clean up for Firestore
      const firestoreData: any = { ...article };
      // Add createdAt timestamp so ordering works properly
      firestoreData.createdAt = new Date().toISOString();

      await setDoc(docRef, firestoreData, { merge: true });
      console.log(`✅ Uploaded article: ${article.id} - ${article.title}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to upload ${article.id}:`, err);
    }
  }

  console.log(`\n🎉 Upload complete! Successfully synced ${successCount}/${NEWS_ARTICLES.length} articles.`);
  process.exit(0);
}

uploadNews();
