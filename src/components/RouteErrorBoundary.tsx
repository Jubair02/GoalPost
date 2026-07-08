import { Component, type ReactNode } from "react";

// Messages browsers/Vite use when a dynamically-imported chunk fails to load —
// typically a stale chunk hash after a redeploy, or a transient network error.
const CHUNK_ERROR = /dynamically imported module|loading chunk|importing a module script failed|error loading dynamically|failed to fetch/i;

function isChunkError(err: unknown): boolean {
  return CHUNK_ERROR.test(String((err as Error)?.message ?? err ?? ""));
}

/**
 * Catches errors thrown while a route renders — crucially, a rejected
 * `React.lazy` import. Without this, one failed page chunk blanks the whole app
 * until a manual refresh. Placed INSIDE the route's keyed wrapper, so simply
 * navigating elsewhere mounts a fresh boundary and recovers.
 */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (isChunkError(error)) {
      // Reload once to fetch fresh chunk hashes; rate-limit to avoid a loop if
      // the reload doesn't resolve it (then the fallback UI below is shown).
      try {
        const last = Number(sessionStorage.getItem("gp-chunk-reload") || 0);
        if (Date.now() - last > 10000) {
          sessionStorage.setItem("gp-chunk-reload", String(Date.now()));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center" role="alert">
          <span className="text-4xl" aria-hidden>🔌</span>
          <p className="text-sm font-semibold">This section didn't load.</p>
          <p className="text-xs text-(--text-dim)">A new version may have just deployed.</p>
          <button onClick={() => window.location.reload()} className="btn-primary focus-ring mt-1 px-6 py-2.5 text-sm">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
