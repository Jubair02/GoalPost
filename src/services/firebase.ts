/**
 * Firebase bootstrap — lazily initialized so the SDK is code-split into its
 * own chunk and never loaded until the leaderboard needs it.
 *
 * Config resolution: VITE_FIREBASE_* env vars take precedence (Vite inlines
 * them at BUILD time), falling back to the committed defaults below. The
 * fallback is why the deployed build works even when the host (e.g. Netlify)
 * has no env vars set — without it, `.env` being gitignored means a cloud build
 * sees no config and the leaderboard silently goes offline.
 *
 * NOTE: a Firebase *web* config is not a secret — it's meant to ship in client
 * code. Access is enforced by Firestore security rules (see firestore.rules)
 * and the project's Authorized Domains, NOT by hiding these values.
 */
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const FALLBACK = {
  apiKey: "AIzaSyCGxwhj8FhCh-sat6aFgJq2gEf42HBd_yE",
  authDomain: "footballquiz-852d4.firebaseapp.com",
  projectId: "footballquiz-852d4",
  storageBucket: "footballquiz-852d4.firebasestorage.app",
  messagingSenderId: "631065639285",
  appId: "1:631065639285:web:a0afa15dd45441c2e27b3c",
};

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? FALLBACK.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? FALLBACK.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? FALLBACK.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? FALLBACK.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? FALLBACK.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? FALLBACK.appId,
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
