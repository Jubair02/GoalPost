/**
 * Firebase bootstrap — lazily initialized so the SDK is code-split into its
 * own chunk and never loaded until auth or the leaderboard needs it.
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
import type { Auth, User } from "firebase/auth";
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

interface Services {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: Promise<Services> | null = null;

/** Initialize the SDK once (no sign-in) and cache the app/auth/db handles. */
function getServices(): Promise<Services> {
  if (!firebaseEnabled) return Promise.reject(new Error("Firebase is not configured"));
  services ??= (async () => {
    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    const app = initializeApp(config as Record<string, string>);
    return { app, auth: getAuth(app), db: getFirestore(app) };
  })();
  return services;
}

/** Observe auth state (Google user, anonymous guest, or signed out). */
export function subscribeAuth(cb: (user: User | null) => void): () => void {
  if (!firebaseEnabled) {
    cb(null);
    return () => {};
  }
  let unsub = () => {};
  let cancelled = false;
  (async () => {
    try {
      const { auth } = await getServices();
      const { onAuthStateChanged } = await import("firebase/auth");
      if (cancelled) return;
      unsub = onAuthStateChanged(auth, cb);
    } catch {
      cb(null);
    }
  })();
  return () => {
    cancelled = true;
    unsub();
  };
}

/**
 * Sign in with Google (popup). Rejects if the provider/domain isn't set up.
 * `isNewUser` is true only on the account's first-ever sign-in to this project,
 * so the caller can route first-timers through identity setup and skip it for
 * returning users.
 *
 * If the current session is an anonymous guest, the Google identity is LINKED
 * to it (linkWithPopup) so the guest's uid — and therefore their cloud profile
 * and leaderboard row — carries over instead of being orphaned. If that Google
 * account already exists as its own user, linking isn't possible and we sign
 * into the existing account instead (its data takes precedence).
 */
export async function signInWithGoogle(): Promise<{ user: User; isNewUser: boolean }> {
  const { auth } = await getServices();
  const { GoogleAuthProvider, signInWithPopup, linkWithPopup, getAdditionalUserInfo } =
    await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      const result = await linkWithPopup(current, provider);
      return { user: result.user, isNewUser: getAdditionalUserInfo(result)?.isNewUser ?? false };
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // Only fall back for "this credential already belongs to another user".
      if (code !== "auth/credential-already-in-use" && code !== "auth/email-already-in-use") throw err;
    }
  }
  const result = await signInWithPopup(auth, provider);
  return { user: result.user, isNewUser: getAdditionalUserInfo(result)?.isNewUser ?? false };
}

/**
 * Create an account with email + password. Upgrades an anonymous guest in place
 * (linkWithCredential) when possible so their progress carries over.
 */
export async function signUpWithEmail(email: string, password: string): Promise<{ user: User; isNewUser: boolean }> {
  const { auth } = await getServices();
  const { createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential } =
    await import("firebase/auth");

  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      const cred = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(current, cred);
      return { user: result.user, isNewUser: true };
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "auth/credential-already-in-use" && code !== "auth/email-already-in-use") throw err;
      // Address already belongs to an account — surface the normal create error below.
    }
  }
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return { user: result.user, isNewUser: true };
}

/** Sign in to an existing email + password account. */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { auth } = await getServices();
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Send a password-reset email. */
export async function sendPasswordReset(email: string): Promise<void> {
  const { auth } = await getServices();
  const { sendPasswordResetEmail } = await import("firebase/auth");
  await sendPasswordResetEmail(auth, email);
}

/** Sign in anonymously (guest). */
export async function signInAsGuest(): Promise<User> {
  const { auth } = await getServices();
  const { signInAnonymously } = await import("firebase/auth");
  const result = await signInAnonymously(auth);
  return result.user;
}

/** Sign out the current user. */
export async function signOutUser(): Promise<void> {
  const { auth } = await getServices();
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
}

export interface FirebaseHandle {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  /** The current user's id — Google or anonymous — used as leaderboard identity. */
  uid: string;
}

/**
 * Resolve Firestore access with the CURRENT user's uid. Used by the leaderboard.
 * If someone reaches it without having signed in (shouldn't happen behind the
 * login gate), it transparently falls back to an anonymous session so the board
 * still works — never overriding an existing (e.g. Google) sign-in.
 */
export async function getFirebase(): Promise<FirebaseHandle> {
  const { app, auth, db } = await getServices();
  if (auth.currentUser) return { app, auth, db, uid: auth.currentUser.uid };

  const { onAuthStateChanged, signInAnonymously } = await import("firebase/auth");
  // IMPORTANT: `auth.currentUser` is null during the async window while a
  // persisted session (e.g. a returning Google user) is being restored.
  // Signing in anonymously here would mint a brand-new uid and create a
  // DUPLICATE leaderboard profile on every visit. Instead, wait for the first
  // onAuthStateChanged emission — which fires only after persistence resolves —
  // and fall back to an anonymous guest only if there is genuinely no session.
  const uid = await new Promise<string>((resolve, reject) => {
    let guestStarted = false;
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsub();
          resolve(user.uid);
        } else if (!guestStarted) {
          guestStarted = true;
          // No persisted session at all — start a guest. The listener above
          // re-fires with the new anonymous user and resolves its uid.
          signInAnonymously(auth).catch((err) => {
            unsub();
            reject(err);
          });
        }
      },
      (err) => {
        unsub();
        reject(err);
      }
    );
  });
  return { app, auth, db, uid };
}

/**
 * Firestore handle WITHOUT forcing any sign-in. For reads/writes keyed by a uid
 * the caller already holds (e.g. from subscribeAuth), so we never mint an
 * anonymous session as a side effect of touching the database.
 */
export async function getFirestoreDb(): Promise<Firestore> {
  const { db } = await getServices();
  return db;
}
