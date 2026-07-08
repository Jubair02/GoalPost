# ⚽ GoalPost — Football Quiz Arena

A premium football quiz web app: five game modes, 24 categories, 240 hand-written questions, XP progression, achievements, trophies, simulated real-time battles and a daily global challenge — wrapped in a glassmorphic, animated, fully responsive UI with dark and light themes.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

No configuration required — the app runs fully offline with progress persisted in local storage.

## Game modes

| Mode | What it is |
|---|---|
| ⚡ **Quick Play** | 10/15/20 random questions across 4 difficulties with per-question countdowns, streak bonuses and instant explanations |
| 📈 **Career** | 24 categories that unlock as you level up; mastery rings track your accuracy per category (+25% XP) |
| 📅 **Daily Challenge** | The same seeded 10-question quiz for everyone each day, one attempt, 1.5× XP. Home of the global **season leaderboard** (real players only, live via Firestore) that every mode's scores feed into and which resets monthly |
| ⚔️ **Battle** | 1v1 vs skill-rated opponents with matchmaking, 3-2-1 kickoff sync, live scores and "opponent thinking" states |
| 🏆 **Tournament** | 8-player knockout bracket (QF → SF → Final); champions collect seasonal trophies |

Progression: XP levels with football-flavoured titles (Sunday Leaguer → GOAT), 20 achievements in 4 tiers, coins, daily login streak rewards, personal bests and full match history in the stats dashboard.

## Scoring

`points = (base + time bonus up to +50%) × streak multiplier (up to 2×)` — base 100/150/200/300 and timer 20/16/13/10s for Easy/Medium/Hard/Expert. Battles award win bonuses; daily and career modes pay XP premiums.

## Tech

- **React 18 + TypeScript + Vite** — strict mode, zero build warnings
- **Tailwind CSS v4** — design tokens via CSS custom properties, glassmorphism, dark/light themes
- **Framer Motion** — page transitions, card reveals, countdowns, celebrations
- **Zustand** (persisted) — player progression and settings
- **canvas-confetti** — trophy and perfect-game celebrations
- **WebAudio** — synthesized SFX (no audio assets), mutable
- Accessibility: semantic roles, aria labels/live regions, focus rings, `prefers-reduced-motion` support

## Architecture

```
src/
├── types/            # Shared domain types
├── data/
│   ├── questions/    # 240 questions in 5 themed modules
│   ├── categories.ts # 24 categories with unlock levels
│   ├── achievements.ts, levels.ts, opponents.ts
├── lib/              # quizEngine (selection/scoring), daily (seeded quiz +
│                     # leaderboard), sound, celebrate
├── services/
│   └── backend.ts    # Persistence adapter (local storage today, Firebase-ready)
├── store/            # zustand stores: player, settings, toasts
├── hooks/            # useQuiz state machine, useOpponentSim, outcome toasts
├── components/       # QuestionCard, VersusHud, ResultScreen, rings, toasts…
└── pages/            # Home, QuickPlay, Career, Daily, Battle, Tournament,
                      # Stats, Profile
```

## Data & the global leaderboard

Two layers, and it matters which is which:

- **Player progression** (XP, coins, achievements, match history, settings) lives in the browser's **`localStorage`** via the `StateBackend` adapter in [src/services/backend.ts](src/services/backend.ts). It's per-device and works offline.
- **The season leaderboard** is **global, real-time, and real-players-only**. Every quiz you finish — Quick Play, Career, Daily, Battle or Tournament — adds its score to your running **monthly season total** (accumulated centrally in `applyResult`, published from `Layout`). [src/services/leaderboard.ts](src/services/leaderboard.ts) writes that total to Firestore and streams the board back with `onSnapshot`, so every player sees the same board update live. Rankings reset at the start of each calendar month (a new season). There are **no simulated/demo entries** — the board shows only real players; when Firebase is unreachable it shows an **Offline** state (empty) rather than placeholders. A green **LIVE** badge indicates a connected real-time board.

### Turning the leaderboard live

1. Create a Firebase project. Enable **Authentication → Anonymous** and create a **Firestore** database.
2. `cp .env.example .env` and fill in the `VITE_FIREBASE_*` values from your project's SDK config.
3. Deploy the security rules: `firebase deploy --only firestore:rules` (rules are in [firestore.rules](firestore.rules) — they enforce that a user may only write their own entry, with a bounded, well-formed score, so clients can't inject fake results).
4. `npm run build` / `npm run dev` — the Daily page now shows a **LIVE** board.

Firestore layout: `leaderboards/{YYYY-MM}/scores/{uid}` (one document per player per month, holding the cumulative season total). Identity is a durable anonymous-auth `uid` (no login screen). The Firebase SDK is lazily, dynamically imported, so it's code-split into its own chunk and never downloaded when Firebase is off.

### Real 1v1 battles (next step)

Battles currently use a local opponent simulation (`useOpponentSim`). To make them truly online, replace it with a Firestore match document both clients write answers into — `BattleMatch` already treats the opponent as an async score stream, so the UI doesn't change.

### Extending the question bank

Add entries in `src/data/questions/*.ts` using the `q(category, difficulty, question, options, answerIndex, explanation)` helper — everything else (selection, difficulty backfill, option shuffling, category stats) picks them up automatically.
