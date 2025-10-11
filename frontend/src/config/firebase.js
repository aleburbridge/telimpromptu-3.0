import { initializeApp } from 'firebase/app';
import { getFirestore, collection, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID;

if (!PROJECT_ID) {
  console.warn('REACT_APP_FIREBASE_PROJECT_ID is not set. Firestore network calls will fail.');
}

export const IS_FIREBASE_CONFIGURED = Boolean(PROJECT_ID);

let app = null;
let dbInstance = null;

if (IS_FIREBASE_CONFIGURED) {
  try {
    app = initializeApp(firebaseConfig);
    // Workaround for environments (proxies/SSE/CORS) where default webchannel/fetch fails.
    // Initialize Firestore with long polling and disable fetch streams to improve compatibility.
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    });
  } catch (initError) {
    console.error('Failed to initialize Firebase app or Firestore with fallback settings', initError);
    // Fallback to standard initialization to preserve behavior for normal environments
    try {
      app = initializeApp(firebaseConfig);
      dbInstance = getFirestore(app);
    } catch (fallbackError) {
      console.error('Fallback Firestore initialization also failed', fallbackError);
      dbInstance = null;
    }
  }
}

export const db = dbInstance;

export const roomsCollectionRef = dbInstance ? collection(dbInstance, 'rooms') : null;
export const playerCollectionRef = dbInstance ? collection(dbInstance, 'players') : null;

export { PROJECT_ID };
export const REGION = 'us-central1';
