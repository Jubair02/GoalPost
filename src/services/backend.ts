/**
 * Persistence adapter for player progression.
 *
 * The app ships with a LocalStorage implementation so it works fully offline
 * with zero configuration. To go multi-device / online, implement
 * `StateBackend` against Firebase and swap it in `createBackend()`:
 *
 *   1. `npm install firebase`
 *   2. Create a Firebase project, enable Anonymous (or Google) Auth and Firestore.
 *   3. Implement FirebaseBackend: `getItem`/`setItem` map to a
 *      `players/{uid}` document (merge writes, `onSnapshot` for live sync),
 *      and mirror score submissions into a `leaderboards/{date}` collection
 *      guarded by security rules that validate score bounds server-side.
 *   4. Return it from `createBackend()` — the stores don't change.
 */
export interface StateBackend {
  getItem(name: string): string | null | Promise<string | null>;
  setItem(name: string, value: string): void | Promise<void>;
  removeItem(name: string): void | Promise<void>;
}

class LocalBackend implements StateBackend {
  getItem(name: string): string | null {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  }
  setItem(name: string, value: string): void {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Storage full or unavailable (private browsing) — play on without persistence.
    }
  }
  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  }
}

export function createBackend(): StateBackend {
  return new LocalBackend();
}
