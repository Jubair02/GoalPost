import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "../store/playerStore";
import { useToastStore } from "../store/toastStore";
import { AVATAR_COLORS, AVATAR_IMAGES } from "../data/opponents";
import {
  signInAsGuest,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
} from "../services/firebase";
import { msUntilNextDaily } from "../lib/daily";
import { IMG } from "../lib/assets";
import { Avatar } from "./Avatar";
import { MediaBg } from "./MediaBg";
import { sfx } from "../lib/sound";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.3 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16z" />
      <path fill="#FBBC05" d="M10.4 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.4-4.6 2.2-7.9 2.2-6.4 0-11.8-3.8-13.6-9.1l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/email-already-in-use":
      return "An account with this email already exists — sign in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts — please try again later.";
    case "auth/network-request-failed":
      return "Network error — check your connection.";
    case "auth/operation-not-allowed":
      return "Email sign-in isn't enabled for this app yet.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in cancelled. Try again or continue as a guest.";
    default:
      return "Something went wrong — try again or continue as a guest.";
  }
}

function useDailyCountdown() {
  const [ms, setMs] = useState(msUntilNextDaily());
  useEffect(() => {
    const t = setInterval(() => setMs(msUntilNextDaily()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LoginPage() {
  const setName = usePlayerStore((s) => s.setName);
  const setAvatar = usePlayerStore((s) => s.setAvatar);
  const [step, setStep] = useState<"auth" | "profile">("auth");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState(AVATAR_IMAGES[0].src);
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const push = useToastStore((s) => s.push);
  const countdown = useDailyCountdown();
  // If email sign-in succeeds but no cloud profile arrives (brand-new account),
  // this fallback routes the user to identity setup instead of a dead end.
  const fallbackTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
  }, []);

  const handleGoogle = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { user, isNewUser } = await signInWithGoogle();
      const name = (user.displayName || user.email?.split("@")[0] || "Player").trim().slice(0, 20);
      if (isNewUser) {
        // First sign-in: send them to identity setup, prefilled from Google, to
        // finish their profile (choose a legend). setBusy stays reset below.
        setDraft(name);
        sfx.click();
        setStep("profile");
        setBusy(false);
      } else {
        // Returning user — go straight in. Cloud sync then hydrates their saved
        // name/avatar over these Google defaults.
        setAvatar({ emoji: "⚽", color: AVATAR_COLORS[0], image: user.photoURL || AVATAR_IMAGES[0].src });
        setName(name);
        sfx.win();
        // No setBusy(false): setName dismisses this page (the component unmounts).
      }
    } catch (err) {
      setError(mapAuthError(err));
      setBusy(false);
    }
  };

  const toastError = (message: string) =>
    push({ icon: "⚠️", title: "Something went wrong", message, accent: "#ff4d4d" });

  const handleSignUp = async (mail: string) => {
    // Client-side validation — surfaced both inline and as a toast.
    if (password !== confirm) {
      setError("Passwords don't match.");
      toastError("Passwords don't match — please re-enter them.");
      return;
    }
    setBusy(true);
    try {
      const { user } = await signUpWithEmail(mail, password);
      // createUserWithEmailAndPassword signs the user in automatically, so
      // there's no manual login step. Set a default identity so the login gate
      // opens and they land on Home immediately (customisable later in Profile).
      const name = (user.displayName || mail.split("@")[0] || "Player").trim().slice(0, 20);
      setAvatar({ emoji: "⚽", color: AVATAR_COLORS[0], image: AVATAR_IMAGES[0].src });
      sfx.win();
      push({ icon: "🎉", title: "Signup successful!", message: "Welcome aboard.", accent: "#00de5f" });
      setName(name); // dismisses this page → redirects to Home
    } catch (err) {
      toastError(mapAuthError(err));
      setBusy(false);
    }
  };

  const handleSignIn = async (mail: string) => {
    setBusy(true);
    try {
      await signInWithEmail(mail, password);
      sfx.win();
      // Returning user: cloud sync hydrates their saved name and this page
      // dismisses itself. If no cloud profile exists, fall back to setup.
      fallbackTimer.current = window.setTimeout(() => {
        if (!usePlayerStore.getState().name) {
          setDraft(mail.split("@")[0].slice(0, 20));
          setStep("profile");
          setBusy(false);
        }
      }, 3500);
    } catch (err) {
      setError(mapAuthError(err));
      setBusy(false);
    }
  };

  const handleEmail = () => {
    const mail = email.trim();
    setError(null);
    setNotice(null);
    if (!EMAIL_RE.test(mail)) {
      setError("Enter a valid email address.");
      if (emailMode === "signup") toastError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      if (emailMode === "signup") toastError("Password must be at least 6 characters.");
      return;
    }
    if (emailMode === "signup") void handleSignUp(mail);
    else void handleSignIn(mail);
  };

  const handleForgot = async () => {
    const mail = email.trim();
    setNotice(null);
    if (!EMAIL_RE.test(mail)) return setError("Enter your email above first, then tap reset.");
    setError(null);
    try {
      await sendPasswordReset(mail);
      setNotice("Password reset email sent — check your inbox.");
    } catch (err) {
      setError(mapAuthError(err));
    }
  };

  const handleGuest = () => {
    sfx.click();
    // Play immediately as a guest; the anonymous session powers the leaderboard
    // if it succeeds, and the app stays fully playable locally if it doesn't.
    void signInAsGuest().catch(() => {});
    setStep("profile");
  };

  const submitProfile = () => {
    const name = draft.trim();
    if (!name) return;
    setAvatar({ emoji: "⚽", color, image });
    setName(name);
    sfx.win();
  };

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="login-title" style={{ background: "var(--bg)" }}>
      {/* Full-bleed legends backdrop on phones & tablets. Fixed so it stays put
          while the tall auth card scrolls. Desktop uses the split hero (right). */}
      <div className="fixed inset-0 lg:hidden" aria-hidden>
        <MediaBg src={IMG.loginHero} focal="center" scrim="full" />
      </div>
      <div className="relative grid min-h-dvh lg:grid-cols-2">
        {/* Hero */}
        <div className="relative hidden overflow-hidden lg:block">
          <MediaBg src={IMG.loginHero} focal="center" scrim="left" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="flex items-center gap-2">
              <span className="text-3xl" aria-hidden>⚽</span>
              <span className="text-2xl font-extrabold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
                Goal<span className="text-gradient">Post</span>
              </span>
            </div>
            <div>
              <h1 className="max-w-md text-4xl font-extrabold leading-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
                Prove you're the greatest <span className="text-gradient">football brain</span> on the planet.
              </h1>
              <ul className="mt-6 flex flex-col gap-2 text-sm text-white/80">
                <li>🏆 Climb the global monthly season leaderboard</li>
                <li>⚡ 24 categories · 240+ hand-written questions</li>
                <li>🔥 Daily challenges, XP, achievements & trophies</li>
              </ul>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
                <span aria-hidden>📅</span> Daily Challenge resets in <span className="led text-(--color-volt)">{countdown}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auth / profile card */}
        <div className="relative flex items-center justify-center overflow-hidden p-5 sm:p-8">
          {/* Stadium backdrop fills the auth column on large screens so it isn't
              a plain dark slab next to the hero. Hidden on mobile (which already
              has the full-bleed legends backdrop behind the card). */}
          <div className="absolute inset-0 hidden lg:block" aria-hidden>
            <MediaBg src={IMG.stadium} focal="center 55%" scrim="full" />
          </div>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="glass-strong relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8"
          >
            {/* mobile logo */}
            <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
              <span className="text-2xl" aria-hidden>⚽</span>
              <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Goal<span className="text-gradient">Post</span>
              </span>
            </div>

            {step === "auth" ? (
              <>
                <h2 id="login-title" className="text-center text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
                  Sign in to play
                </h2>
                <p className="mx-auto mt-1 mb-6 max-w-xs text-center text-sm text-(--text-dim)">
                  Save your progress and climb the global leaderboard.
                </p>

                <button
                  onClick={handleGoogle}
                  disabled={busy}
                  className="focus-ring flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3.5 font-semibold text-[#1f1f1f] shadow-sm transition hover:brightness-95 disabled:opacity-60"
                >
                  {busy ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black/70" aria-hidden />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>

                <div className="my-4 flex items-center gap-3 text-xs text-(--text-faint)">
                  <span className="h-px flex-1 bg-(--border)" /> or <span className="h-px flex-1 bg-(--border)" />
                </div>

                {/* Email + password */}
                <div className="flex flex-col gap-2.5">
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    aria-label="Email address"
                    className="focus-ring w-full rounded-2xl border border-(--border-strong) bg-(--surface) p-3.5 font-medium outline-none placeholder:text-(--text-faint)"
                  />
                  <input
                    type="password"
                    autoComplete={emailMode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !busy && handleEmail()}
                    placeholder="Password"
                    aria-label="Password"
                    className="focus-ring w-full rounded-2xl border border-(--border-strong) bg-(--surface) p-3.5 font-medium outline-none placeholder:text-(--text-faint)"
                  />
                  {emailMode === "signup" && (
                    <>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !busy && handleEmail()}
                        placeholder="Confirm password"
                        aria-label="Confirm password"
                        aria-invalid={confirm.length > 0 && confirm !== password}
                        className={`focus-ring w-full rounded-2xl border bg-(--surface) p-3.5 font-medium outline-none placeholder:text-(--text-faint) ${
                          confirm.length > 0 && confirm !== password ? "border-(--color-danger)" : "border-(--border-strong)"
                        }`}
                      />
                      {confirm.length > 0 && confirm !== password && (
                        <p className="-mt-0.5 text-xs text-(--color-danger)">Passwords don't match.</p>
                      )}
                    </>
                  )}
                  <button onClick={handleEmail} disabled={busy} className="btn-primary focus-ring w-full py-3.5 disabled:opacity-60">
                    {busy ? "Please wait…" : emailMode === "signup" ? "Create account" : "Sign in"}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <button
                    onClick={() => { setEmailMode((m) => (m === "signin" ? "signup" : "signin")); setError(null); setNotice(null); setConfirm(""); }}
                    className="focus-ring font-semibold text-(--color-pitch-300) hover:underline"
                  >
                    {emailMode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
                  </button>
                  {emailMode === "signin" && (
                    <button onClick={handleForgot} className="focus-ring text-(--text-faint) hover:text-(--text-dim)">
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="my-4 flex items-center gap-3 text-xs text-(--text-faint)">
                  <span className="h-px flex-1 bg-(--border)" /> or <span className="h-px flex-1 bg-(--border)" />
                </div>

                <button onClick={handleGuest} disabled={busy} className="btn-ghost focus-ring w-full py-3.5 disabled:opacity-60">
                  Continue as guest
                </button>

                {error && (
                  <p className="mt-4 rounded-xl border border-(--color-danger)/40 bg-(--color-danger)/10 p-3 text-center text-xs text-(--color-danger)" role="alert">
                    {error}
                  </p>
                )}
                {notice && (
                  <p className="mt-4 rounded-xl border border-(--color-pitch-500)/40 bg-(--color-pitch-500)/10 p-3 text-center text-xs text-(--color-pitch-300)" role="status">
                    {notice}
                  </p>
                )}

                <p className="mt-6 text-center text-[11px] leading-relaxed text-(--text-faint)">
                  We only store your display name, chosen badge and scores. No email or personal data is shared publicly.
                </p>
              </>
            ) : (
              <>
                <h2 id="login-title" className="text-center text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
                  Choose your identity
                </h2>
                <p className="mb-5 text-center text-sm text-(--text-dim)">Pick a legend and a name to enter the arena.</p>

                <div className="mb-5 flex justify-center">
                  <Avatar avatar={{ emoji: "⚽", color, image }} size={84} />
                </div>

                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-(--text-faint)" htmlFor="player-name">
                  Player name
                </label>
                <input
                  id="player-name"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitProfile()}
                  maxLength={20}
                  placeholder="e.g. GoldenBoot99"
                  autoFocus
                  className="focus-ring mb-5 w-full rounded-2xl border border-(--border-strong) bg-(--surface) p-3.5 font-semibold outline-none placeholder:text-(--text-faint)"
                />

                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-(--text-faint)">Choose your legend</div>
                <div className="mb-4 flex flex-wrap justify-center gap-2.5" role="radiogroup" aria-label="Avatar portrait">
                  {AVATAR_IMAGES.map((a) => (
                    <button
                      key={a.src}
                      role="radio"
                      aria-checked={image === a.src}
                      aria-label={a.label}
                      title={a.label}
                      onClick={() => { setImage(a.src); sfx.click(); }}
                      className={`focus-ring h-14 w-14 overflow-hidden rounded-full border-2 transition ${
                        image === a.src ? "scale-110 border-(--color-pitch-400) shadow-[0_0_16px_-2px_var(--glow-pitch)]" : "border-(--border-strong) opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={a.src} alt="" aria-hidden className="h-full w-full object-cover" style={{ objectPosition: "center 18%" }} />
                    </button>
                  ))}
                </div>

                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-(--text-faint)">Colour</div>
                <div className="mb-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar colour">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      role="radio"
                      aria-checked={color === c}
                      aria-label={`Colour ${c}`}
                      onClick={() => { setColor(c); sfx.click(); }}
                      className={`focus-ring h-10 w-10 rounded-full border-2 transition ${color === c ? "scale-115 border-white" : "border-transparent"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>

                <button onClick={submitProfile} disabled={!draft.trim()} className="btn-primary focus-ring w-full py-3.5">
                  Enter the Arena ⚽
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
