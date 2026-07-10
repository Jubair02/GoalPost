#!/usr/bin/env node
/**
 * One-off maintenance: remove duplicate leaderboard profiles created by the old
 * getFirebase() anonymous-fallback race (fixed in src/services/firebase.ts).
 *
 * For each season (leaderboards/{YYYY-MM}) it groups score docs by the same
 * player — matched on normalized name + exact avatar (image + colour), which is
 * how the race duplicated a single person: same locally-stored profile, fresh
 * anonymous uid. Within each group it KEEPS the strongest doc (highest score,
 * tie-break most recently updated) and deletes the rest.
 *
 * Uses the Firebase Admin SDK, which bypasses Firestore rules — so the
 * `allow delete: if false` rule stays untouched.
 *
 * Usage:
 *   npm i -D firebase-admin
 *   # Firebase console -> Project settings -> Service accounts ->
 *   #   "Generate new private key" -> save as serviceAccount.json in repo root
 *   node scripts/dedupe-leaderboard.mjs            # DRY RUN — prints the plan
 *   node scripts/dedupe-leaderboard.mjs --apply    # actually delete
 *
 * The key path can also be given via GOOGLE_APPLICATION_CREDENTIALS.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");
const here = dirname(fileURLToPath(import.meta.url));
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : resolve(here, "..", "serviceAccount.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch {
  console.error(`Could not read service-account key at:\n  ${keyPath}\n`);
  console.error("Download it from Firebase console -> Project settings ->");
  console.error("Service accounts -> Generate new private key, and save it as");
  console.error("serviceAccount.json in the repo root (or set GOOGLE_APPLICATION_CREDENTIALS).");
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const norm = (s) => (s ?? "").trim().toLowerCase();
// Same-person key: name + exact avatar. The bug's duplicates share all three
// (they came from the same localStorage profile); genuinely different players
// almost never collide on all three at once.
const personKey = (d) => `${norm(d.name)}|${d.avatar?.image ?? ""}|${d.avatar?.color ?? ""}`;

// Every score doc across every season (path: leaderboards/{period}/scores/{uid}).
const snap = await db.collectionGroup("scores").get();

const seasons = new Map(); // seasonId -> array of { ref, id, data }
for (const doc of snap.docs) {
  const seasonId = doc.ref.parent.parent?.id ?? "(unknown)";
  if (!seasons.has(seasonId)) seasons.set(seasonId, []);
  seasons.get(seasonId).push({ ref: doc.ref, id: doc.id, data: doc.data() });
}

const toDelete = [];
for (const [seasonId, docs] of seasons) {
  const groups = new Map();
  for (const d of docs) {
    const k = personKey(d.data);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(d);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort(
      (a, b) =>
        (b.data.score ?? 0) - (a.data.score ?? 0) ||
        (b.data.updatedAt ?? 0) - (a.data.updatedAt ?? 0)
    );
    const [keep, ...dups] = group;
    console.log(`\n[${seasonId}] "${keep.data.name}" — ${group.length} profiles`);
    console.log(`  KEEP   ${keep.id}  score=${keep.data.score}`);
    for (const d of dups) {
      console.log(`  DELETE ${d.id}  score=${d.data.score}`);
      toDelete.push(d.ref);
    }
  }
}

console.log(
  `\n${toDelete.length} duplicate doc(s) across ${seasons.size} season(s).`
);
if (!toDelete.length) process.exit(0);

if (!APPLY) {
  console.log("Dry run — nothing deleted. Review the plan above, then re-run with --apply.");
  process.exit(0);
}

let batch = db.batch();
let n = 0;
for (const ref of toDelete) {
  batch.delete(ref);
  if (++n % 450 === 0) {
    await batch.commit();
    batch = db.batch();
  }
}
await batch.commit();
console.log(`Deleted ${toDelete.length} duplicate profile(s).`);
process.exit(0);
