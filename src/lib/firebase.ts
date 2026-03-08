import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

// Placeholder config so build/prerender succeeds when env is not set (e.g. Vercel before env vars are added).
// At runtime, set NEXT_PUBLIC_FIREBASE_* in Vercel (or .env.local locally) for real Firebase.
const placeholderConfig = {
  apiKey: "build-placeholder",
  authDomain: "localhost",
  projectId: "placeholder",
  storageBucket: "placeholder",
  messagingSenderId: "0",
  appId: "1:0:web:0",
};

const app: FirebaseApp =
  !getApps().length
    ? initializeApp(hasConfig ? firebaseConfig : placeholderConfig)
    : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics only runs in the browser (required by Firebase)
let analytics: ReturnType<typeof import("firebase/analytics").getAnalytics> | null = null;
if (typeof window !== "undefined") {
  import("firebase/analytics")
    .then(({ getAnalytics }) => {
      analytics = getAnalytics(app);
    })
    .catch(() => {
      // getAnalytics can fail in some environments
    });
}

export { app, auth, db, storage, analytics };
