import { useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore, useLevel } from "../store/playerStore";
import { ACHIEVEMENTS, TIER_COLORS } from "../data/achievements";
import { AVATAR_COLORS, AVATAR_EMOJIS } from "../data/opponents";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { ProgressRing } from "../components/ProgressRing";
import { sfx } from "../lib/sound";

export function ProfilePage() {
  const p = usePlayerStore();
  const level = useLevel();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.name);
  const [confirmReset, setConfirmReset] = useState(false);

  const memberSince = new Date(p.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const saveName = () => {
    if (draft.trim()) p.setName(draft);
    setEditing(false);
    sfx.click();
  };

  return (
    <div>
      <PageHeader icon="👤" title="Profile" subtitle="Customize your player identity." />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Identity card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-6 text-center sm:p-8 lg:col-span-2"
          aria-label="Player card"
        >
          <div className="flex justify-center">
            <ProgressRing progress={level.progress} size={128} stroke={6} label="Level progress">
              <Avatar avatar={p.avatar} size={104} />
            </ProgressRing>
          </div>

          {editing ? (
            <div className="mt-4 flex items-center justify-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                maxLength={20}
                autoFocus
                aria-label="Player name"
                className="focus-ring w-44 rounded-xl border border-(--border-strong) bg-(--surface) p-2 text-center font-bold outline-none"
              />
              <button onClick={saveName} className="btn-primary focus-ring px-3 py-2 text-sm">✓</button>
            </div>
          ) : (
            <button
              onClick={() => { setDraft(p.name); setEditing(true); }}
              className="focus-ring mt-4 text-2xl font-extrabold hover:opacity-80"
              style={{ fontFamily: "var(--font-display)" }}
              title="Edit name"
            >
              {p.name || "Rookie"} <span className="text-sm opacity-50" aria-hidden>✏️</span>
            </button>
          )}

          <div className="mt-1 text-sm text-(--text-dim)">
            Level {level.level} · {level.title}
          </div>
          <div className="mt-0.5 text-xs text-(--text-faint)">Member since {memberSince}</div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="glass rounded-2xl p-3">
              <div className="font-mono text-lg font-bold text-(--color-volt)">{p.xp.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-(--text-faint)">Total XP</div>
            </div>
            <div className="glass rounded-2xl p-3">
              <div className="font-mono text-lg font-bold text-(--color-gold)">🪙 {p.coins.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-(--text-faint)">Coins</div>
            </div>
            <div className="glass rounded-2xl p-3">
              <div className="font-mono text-lg font-bold">🏆 {p.tournamentsWon}</div>
              <div className="text-[10px] uppercase tracking-wider text-(--text-faint)">Trophies</div>
            </div>
          </div>

          {/* Avatar customization */}
          <div className="mt-6 text-left">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-(--text-faint)">Badge</h3>
            <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Avatar emoji">
              {AVATAR_EMOJIS.map((e) => (
                <button
                  key={e}
                  role="radio"
                  aria-checked={p.avatar.emoji === e}
                  onClick={() => { p.setAvatar({ ...p.avatar, emoji: e }); sfx.click(); }}
                  className={`focus-ring flex h-9 items-center justify-center rounded-xl border text-lg transition ${
                    p.avatar.emoji === e ? "border-(--color-pitch-400) bg-(--color-pitch-500)/15 scale-110" : "border-(--border) bg-(--surface)"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <h3 className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider text-(--text-faint)">Colour</h3>
            <div className="flex gap-2" role="radiogroup" aria-label="Avatar colour">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  role="radio"
                  aria-checked={p.avatar.color === c}
                  aria-label={`Colour ${c}`}
                  onClick={() => { p.setAvatar({ ...p.avatar, color: c }); sfx.click(); }}
                  className={`focus-ring h-8 w-8 rounded-full border-2 transition ${p.avatar.color === c ? "scale-115 border-white" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="mt-8 border-t border-(--border) pt-4">
            {confirmReset ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-(--text-dim)">Wipe all progress?</span>
                <button
                  onClick={() => { p.resetProgress(); setConfirmReset(false); }}
                  className="focus-ring rounded-lg bg-(--color-danger)/15 px-3 py-1.5 font-bold text-(--color-danger)"
                >
                  Yes, reset
                </button>
                <button onClick={() => setConfirmReset(false)} className="btn-ghost focus-ring px-3 py-1.5">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} className="focus-ring text-xs font-semibold text-(--text-faint) hover:text-(--color-danger)">
                Reset career
              </button>
            )}
          </div>
        </motion.section>

        {/* Achievements + trophies */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          <section className="glass rounded-3xl p-5 sm:p-6" aria-label="Achievement collection">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>🏅 Achievement Collection</h2>
              <span className="chip">{p.achievements.length}/{ACHIEVEMENTS.length}</span>
            </div>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {ACHIEVEMENTS.map((a, i) => {
                const unlocked = p.achievements.includes(a.id);
                return (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${
                      unlocked ? "border-(--border-strong) bg-(--surface)" : "border-(--border) bg-(--surface) opacity-45"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${unlocked ? "" : "grayscale"}`}
                      style={{ background: `${TIER_COLORS[a.tier]}18`, border: `1px solid ${TIER_COLORS[a.tier]}${unlocked ? "66" : "22"}` }}
                      aria-hidden
                    >
                      {unlocked ? a.icon : "🔒"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        {a.name}
                        <span
                          className="rounded-full px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wider"
                          style={{ color: TIER_COLORS[a.tier], background: `${TIER_COLORS[a.tier]}1a` }}
                        >
                          {a.tier}
                        </span>
                      </div>
                      <div className="truncate text-xs text-(--text-dim)">{a.description}</div>
                    </div>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-(--text-faint)">+{a.xpReward}</span>
                  </motion.li>
                );
              })}
            </ul>
          </section>

          <section className="glass rounded-3xl p-5 sm:p-6" aria-label="Trophy cabinet">
            <h2 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>🏆 Trophy Cabinet</h2>
            {p.trophies.length === 0 ? (
              <p className="text-sm text-(--text-dim)">Win a tournament to fill your cabinet with silverware.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {p.trophies.map((t, i) => (
                  <motion.span
                    key={`${t}-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 15 }}
                    className="chip !border-(--color-gold)/40 text-(--color-gold)"
                  >
                    🏆 {t}
                  </motion.span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
