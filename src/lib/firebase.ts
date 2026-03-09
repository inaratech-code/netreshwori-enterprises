import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Storage bucket must be only the bucket name (e.g. "project-id.appspot.com").
// If set as gs://... or a full API URL, normalize to avoid "Invalid HTTP method/URL pair" from Firebase.
function normalizeStorageBucket(raw: string | undefined): string | undefined {
  if (!raw || typeof raw !== "string") return raw;
  const s = raw.trim();
  if (!s) return undefined;
  if (s.startsWith("gs://")) return s.slice(5).split("/")[0] || undefined;
  try {
    const u = new URL(s);
    if (u.hostname === "firebasestorage.googleapis.com" && u.pathname.startsWith("/v0/b/")) {
      const match = u.pathname.match(/^\/v0\/b\/([^/]+)/);
      return match ? match[1] : undefined;
    }
    return u.hostname || s;
  } catch {
    return s;
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: normalizeStorageBucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

const app: FirebaseApp = !getApps().length && hasConfig
  ? initializeApp(firebaseConfig)
  : getApps().length
    ? getApp()
    : (() => {
        throw new Error(
          "Missing Firebase env. Copy .env.example to .env.local and add your Firebase config. See FIREBASE_SETUP.md"
        );
      })();

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
