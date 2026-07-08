import type { ComponentType } from "react";

type Loader = () => Promise<{ default: ComponentType }>;

/** Retry a dynamic import once after a short delay, smoothing transient fetch blips. */
function retry<T>(fn: () => Promise<T>, times = 1, delayMs = 400): Promise<T> {
  return fn().catch((err) =>
    times > 0 ? new Promise<T>((res, rej) => setTimeout(() => retry(fn, times - 1, delayMs).then(res, rej), delayMs)) : Promise.reject(err)
  );
}

/** Dynamic import per page (named export → default), shared by lazy() + prefetch. */
export const routeLoaders = {
  "/": () => retry(() => import("./pages/HomePage")).then((m) => ({ default: m.HomePage })),
  "/play": () => retry(() => import("./pages/QuickPlayPage")).then((m) => ({ default: m.QuickPlayPage })),
  "/career": () => retry(() => import("./pages/CareerPage")).then((m) => ({ default: m.CareerPage })),
  "/daily": () => retry(() => import("./pages/DailyPage")).then((m) => ({ default: m.DailyPage })),
  "/battle": () => retry(() => import("./pages/BattlePage")).then((m) => ({ default: m.BattlePage })),
  "/tournament": () => retry(() => import("./pages/TournamentPage")).then((m) => ({ default: m.TournamentPage })),
  "/stats": () => retry(() => import("./pages/StatsPage")).then((m) => ({ default: m.StatsPage })),
  "/profile": () => retry(() => import("./pages/ProfilePage")).then((m) => ({ default: m.ProfilePage })),
} satisfies Record<string, Loader>;

const prefetched = new Set<string>();

/** Warm a route's chunk (e.g. on nav hover) so navigation is instant. */
export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = routeLoaders[path as keyof typeof routeLoaders];
  if (!loader) return;
  prefetched.add(path);
  loader().catch(() => prefetched.delete(path));
}
