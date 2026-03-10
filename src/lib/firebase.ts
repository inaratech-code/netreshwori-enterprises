import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

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
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId;

// When env is missing (e.g. CI build without Build variables), use a placeholder so the build
// completes. Set NEXT_PUBLIC_FIREBASE_* in your host's Build/Environment variables for production.
// Only initialize Firebase in the browser; Cloudflare Workers runtime can throw when running
// getAuth/getFirestore/getStorage or even getApps() (e.g. unsupported APIs), causing 500 on SSR.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  const isBrowser = typeof window !== "undefined";
  const existingApps = getApps().length;
  if (existingApps) {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else if (isBrowser) {
    app = initializeApp(
      hasConfig
        ? firebaseConfig
        : {
            apiKey: "build-placeholder",
            authDomain: "build-placeholder.firebaseapp.com",
            projectId: "build-placeholder",
            storageBucket: "build-placeholder.appspot.com",
            messagingSenderId: "0",
            appId: "1:0:web:0",
          }
    );
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch {
  // SSR / Cloudflare Workers: Firebase SDK can throw at load or init; keep nulls so app still renders.
}

/** Use in client code that needs Firestore; throws if not in browser / Firebase not ready. */
export function getDb(): Firestore {
  if (!db) throw new Error("Firebase Firestore is not available (e.g. during SSR).");
  return db;
}

/** Use in client code that needs Storage; throws if not available. */
export function getStorageSafe(): FirebaseStorage {
  if (!storage) throw new Error("Firebase Storage is not available (e.g. during SSR).");
  return storage;
}

// Analytics only runs in the browser (required by Firebase)
let analytics: ReturnType<typeof import("firebase/analytics").getAnalytics> | null = null;
if (typeof window !== "undefined" && app) {
  import("firebase/analytics")
    .then(({ getAnalytics }) => {
      analytics = getAnalytics(app!);
    })
    .catch(() => {
      // getAnalytics can fail in some environments
    });
}

export { app, auth, db, storage, analytics };
