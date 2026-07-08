/**
 * Firebase bootstrap — lazily initialized so the SDK is code-split into its
 * own chunk and never loaded (or even downloaded) when Firebase isn't
 * configured. Fill the VITE_FIREBASE_* env vars (see .env.example) to switch
 * the app from local-only simulation to a real, shared, real-time backend.
 */
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True when enough config is present to talk to a real project. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

export interface FirebaseHandle {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  /** Stable anonymous user id — the player's identity on the leaderboard. */
  uid: string;
}

let handle: Promise<FirebaseHandle> | null = null;

/**
 * Initialize (once) and resolve with an authenticated handle. Signs the user
 * in anonymously so every device has a durable id without a login screen.
 */
export function getFirebase(): Promise<FirebaseHandle> {
  if (!firebaseEnabled) {
    return Promise.reject(new Error("Firebase is not configured"));
  }
  handle ??= (async () => {
    const [{ initializeApp }, { getAuth, signInAnonymously, onAuthStateChanged }, { getFirestore }] =
      await Promise.all([import("firebase/app"), import("firebase/auth"), import("firebase/firestore")]);

    const app = initializeApp(config as Record<string, string>);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const uid = await new Promise<string>((resolve, reject) => {
      const unsub = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            unsub();
            resolve(user.uid);
          }
        },
        reject
      );
      signInAnonymously(auth).catch(reject);
    });

    return { app, auth, db, uid };
  })();
  return handle;
}
