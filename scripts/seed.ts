import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { SURAH_LIST } from '../src/constants/quran';

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
});

const db = getFirestore(app);

async function run() {
  await setDoc(doc(db, 'quran', 'meta'), {
    surahs: SURAH_LIST,
    updatedAt: new Date().toISOString()
  });
  console.log('Quran metadata seeded into quran/meta');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
