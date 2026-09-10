"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type SkillNode, type Lang } from "@/lib/content";
import { getData, UI, type UIStrings } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useProgress } from "@/lib/useProgress";
import { useQuiz } from "@/lib/useQuiz";
import QuizPanel from "@/components/QuizPanel";

const LANG_KEY = "sa-lang";

function rankFor(xp: number, ranks: [number, string][]): [number, string] {
  let r = ranks[0];
  for (const x of ranks) if (xp >= x[0]) r = x;
  return r;
}

export default function SkillTree() {
  const { cleared, clearNode, reset, user, status, signIn, signOut } = useProgress();
  const quiz = useQuiz(user);
  const [quizOpen, setQuizOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("vi");
  const [selected, setSelected] = useState<SkillNode | null>(null);
  const [toast, setToast] = useState<{ html: string; show: boolean }>({ html: "", show: false });
  const [shakeId, setShakeId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ngôn ngữ: nạp từ localStorage sau khi mount (tránh lệch hydration).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as Lang | null;
      if (saved === "vi" || saved === "en") setLang(saved);
    } catch {}
  }, []);
  const changeLang = useCallback((l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  }, []);

  const ui = UI[lang];
  const { nodes: NODES, tiers: TIERS, ranks: RANKS } = useMemo(() => getData(lang), [lang]);
  const nodeById = useMemo(() => new Map(NODES.map((n) => [n.id, n])), [NODES]);

  const showToast = useCallback((html: string) => {
    setToast({ html, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3600);
  }, []);

  const isCleared = useCallback((id: string) => cleared.has(id), [cleared]);
  const isAvailable = useCallback((n: SkillNode) => n.prereq.every((p) => cleared.has(p)), [cleared]);
  const missing = useCallback((n: SkillNode) => n.prereq.filter((p) => !cleared.has(p)), [cleared]);

  const xp = useMemo(
    () => NODES.filter((n) => cleared.has(n.id)).reduce((s, n) => s + n.xp, 0),
    [cleared, NODES]
  );
  const doneCount = useMemo(() => NODES.filter((n) => cleared.has(n.id)).length, [cleared, NODES]);
  const rank = rankFor(xp, RANKS);
  const rankIdx = RANKS.findIndex((r) => r[1] === rank[1]);
  const nextRank = RANKS[rankIdx + 1];
  const barPct = nextRank
    ? Math.min(100, Math.round(((xp - rank[0]) / (nextRank[0] - rank[0])) * 100))
    : 100;
  const dueCount = quiz.ready ? quiz.stats(NODES, cleared).due : 0;

  // Keep the drawer's node in sync with the active language.
  const selectedLocalized = selected ? nodeById.get(selected.id) ?? null : null;

  const onCardClick = (n: SkillNode) => {
    const avail = isAvailable(n);
    const done = isCleared(n.id);
    if (!avail && !done) {
      setShakeId(null);
      requestAnimationFrame(() => setShakeId(n.id));
      showToast(ui.lockToast(missing(n).join(", ")));
      return;
    }
    setSelected(n);
  };

  const onClear = (n: SkillNode) => {
    if (cleared.has(n.id)) return;
    const before = new Set(NODES.filter((x) => isAvailable(x) && !isCleared(x.id)).map((x) => x.id));
    clearNode(n.id);
    const nextCleared = new Set(cleared);
    nextCleared.add(n.id);
    const newly = NODES.filter(
      (x) => x.prereq.every((p) => nextCleared.has(p)) && !nextCleared.has(x.id)
    )
      .map((x) => x.id)
      .filter((id) => !before.has(id));
    showToast(ui.clearToast(n.id, n.xp, newly));
    setSelected(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <div className="wrap">
        <div className="hud">
          <div className="brand">
            <span className="eyebrow">{ui.eyebrow}</span>
            <h1>{ui.h1}</h1>
            <p>{ui.tagline}</p>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="k">{ui.rank}</span>
              <span className="v gold">Lv {rankIdx + 1}</span>
              <span className="rank">{rank[1]}</span>
            </div>
            <div className="stat">
              <span className="k">{ui.xp}</span>
              <span className="v">{xp}</span>
              <div className="bar" style={{ marginTop: 4 }}>
                <i style={{ width: `${barPct}%` }} />
              </div>
            </div>
            <div className="stat">
              <span className="k">{ui.progress}</span>
              <span className="v mint">
                {doneCount} / {NODES.length}
              </span>
            </div>
            <button className="btn quizbtn" onClick={() => setQuizOpen(true)}>
              🎯 {ui.quiz.open}
              {dueCount > 0 && <span className="qbadge">{dueCount}</span>}
            </button>
            <div className="langtoggle" role="group" aria-label="Language">
              <button className={lang === "vi" ? "on" : ""} onClick={() => changeLang("vi")}>
                VI
              </button>
              <button className={lang === "en" ? "on" : ""} onClick={() => changeLang("en")}>
                EN
              </button>
            </div>
            <button
              className="btn"
              onClick={() => {
                if (confirm(ui.resetConfirm)) {
                  reset();
                  showToast(ui.resetDone);
                }
              }}
            >
              {ui.reset}
            </button>
          </div>
        </div>

        <AuthBar
          configured={isSupabaseConfigured}
          email={user?.email ?? null}
          status={status}
          onSignIn={signIn}
          onSignOut={signOut}
          t={ui.auth}
        />

        <p className="intro" dangerouslySetInnerHTML={{ __html: ui.intro }} />

        <div className="legend">
          <span>
            <i className="dot l" /> {ui.legendLocked}
          </span>
          <span>
            <i className="dot a" /> {ui.legendAvail}
          </span>
          <span>
            <i className="dot c" /> {ui.legendCleared}
          </span>
        </div>

        {TIERS.map((T) => {
          const nodes = NODES.filter((n) => n.tier === T.id);
          if (!nodes.length) return null;
          return (
            <section className="tier" key={T.id}>
              <div className="tier-head">
                <span className="n">{T.n}</span>
                <h2>{T.t}</h2>
                <span className="sub">{T.sub}</span>
              </div>
              <div className="grid">
                {nodes.map((n) => {
                  const avail = isAvailable(n);
                  const done = isCleared(n.id);
                  const state = done ? "cleared" : avail ? "available" : "locked";
                  const statusTxt = done ? ui.statusCleared : avail ? ui.statusAvail : ui.statusLocked;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className={`node ${state}${n.boss ? " boss" : ""}${
                        shakeId === n.id ? " shake" : ""
                      }`}
                      onClick={() => onCardClick(n)}
                      onAnimationEnd={() => shakeId === n.id && setShakeId(null)}
                    >
                      <span className="accent" />
                      <div className="top">
                        <span className="code">{n.id}</span>
                        <span className="status">{statusTxt}</span>
                      </div>
                      <h3>{n.title}</h3>
                      <p className="sum">{n.sum}</p>
                      <div className="foot">
                        <span className="xp">+{n.xp} XP</span>
                        {!avail && !done && (
                          <span className="lockmsg">
                            {ui.needPrefix} {missing(n).join(" · ")}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className={`overlay${selected ? " open" : ""}`} onClick={() => setSelected(null)} />
      <Drawer
        node={selectedLocalized}
        cleared={selected ? isCleared(selected.id) : false}
        onClose={() => setSelected(null)}
        onClear={onClear}
        ui={ui}
      />

      <QuizPanel
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        nodes={NODES}
        cleared={cleared}
        ui={ui}
        quiz={quiz}
      />

      <div
        className={`toast${toast.show ? " show" : ""}`}
        dangerouslySetInnerHTML={{ __html: toast.html }}
      />
    </div>
  );
}

/* ---------------- Auth bar ---------------- */
function AuthBar({
  configured,
  email,
  status,
  onSignIn,
  onSignOut,
  t,
}: {
  configured: boolean;
  email: string | null;
  status: "local" | "syncing" | "synced";
  onSignIn: (email: string) => Promise<{ error: string | null }>;
  onSignOut: () => Promise<void>;
  t: UIStrings["auth"];
}) {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!configured) {
    return (
      <div className="authbar">
        <span className="pill local">{t.localPill}</span>
        <span className="msg" dangerouslySetInnerHTML={{ __html: t.localMsg }} />
      </div>
    );
  }

  if (email) {
    const pill = status === "synced" ? "synced" : status === "syncing" ? "syncing" : "local";
    const label =
      status === "synced" ? t.syncedLabel : status === "syncing" ? t.syncingLabel : t.localLabel;
    return (
      <div className="authbar">
        <span className={`pill ${pill}`}>{label}</span>
        <span className="msg" dangerouslySetInnerHTML={{ __html: t.signedIn(email) }} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSignOut();
          }}
        >
          <button className="btn" type="submit">
            {t.signOut}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="authbar">
      <span className="pill local">{t.notSignedPill}</span>
      <span className="msg">{msg ?? t.prompt}</span>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!value) return;
          setSending(true);
          const { error } = await onSignIn(value);
          setSending(false);
          setMsg(error ? t.errorPrefix(error) : t.sent(value));
        }}
      >
        <input
          type="email"
          required
          placeholder={t.emailPlaceholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn" type="submit" disabled={sending}>
          {sending ? t.sending : t.send}
        </button>
      </form>
    </div>
  );
}

/* ---------------- Drawer ---------------- */
function Drawer({
  node,
  cleared,
  onClose,
  onClear,
  ui,
}: {
  node: SkillNode | null;
  cleared: boolean;
  onClose: () => void;
  onClear: (n: SkillNode) => void;
  ui: UIStrings;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  useEffect(() => {
    setOpen({});
  }, [node?.id]);

  return (
    <aside className={`drawer${node ? " open" : ""}`} aria-hidden={!node}>
      {node && (
        <>
          <div className="d-head">
            <div>
              <div className="code">{node.id}</div>
              <h2>{node.title}</h2>
            </div>
            <button className="d-close" aria-label="Close" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="d-body">
            <h4>{ui.whatIs}</h4>
            <div dangerouslySetInnerHTML={{ __html: node.theory }} />
            <h4>{ui.whenUse}</h4>
            <div dangerouslySetInnerHTML={{ __html: node.whenUse }} />
            <div className="prosbox">
              <div className="pro">
                <h5>{ui.pros}</h5>
                <ul>
                  {node.pros.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="con">
                <h5>{ui.cons}</h5>
                <ul>
                  {node.cons.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            {node.calc && <Calculator ui={ui} />}

            <h4>{ui.questions}</h4>
            {node.questions.map((q, i) => (
              <div className="q" key={i}>
                <p className="qq">
                  <b>{ui.qLabel(i + 1)}</b> {q.q}
                </p>
                <button className="reveal" onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
                  {open[i] ? ui.revealHide : ui.revealShow}
                </button>
                {open[i] && <div className="ans" dangerouslySetInnerHTML={{ __html: q.a }} />}
              </div>
            ))}

            <h4>{ui.lab}</h4>
            <div className="lab" dangerouslySetInnerHTML={{ __html: node.lab }} />

            <h4>{ui.sources}</h4>
            <div className="links">
              {node.links.map((l, i) => (
                <a key={i} href={`https://${l.u}`} target="_blank" rel="noopener noreferrer">
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="t">{l.t}</span>
                  <span className="u">{l.u.split("/")[0]}</span>
                </a>
              ))}
            </div>
          </div>
          <div className="d-foot">
            {cleared ? (
              <>
                <button className="clearbtn done" disabled>
                  {ui.clearedBtn}
                </button>
                <span className="prereq-note">{ui.xpEarned(node.xp)}</span>
              </>
            ) : (
              <>
                <button className="clearbtn" onClick={() => onClear(node)}>
                  {ui.clearBtn(node.xp)}
                </button>
                <span className="prereq-note">{ui.clearHint}</span>
              </>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

/* ---------------- Capacity calculator ---------------- */
function Calculator({ ui }: { ui: UIStrings }) {
  const c = ui.calc;
  const [rps, setRps] = useState(6000);
  const [lat, setLat] = useState(150);
  const [core, setCore] = useState(4);
  const [cap, setCap] = useState(800);

  const inflight = Math.round(rps * (lat / 1000));
  const workers = Math.ceil(inflight / 0.7);
  const nodes = Math.ceil(rps / (cap * 0.7)) + 1;
  const pool = core * 2 + 1;

  const cells: [string, number | string, string][] = [
    [c.cInflight, inflight, c.cInflightSub],
    [c.cWorker, workers, c.cWorkerSub],
    [c.cNodes, nodes, c.cNodesSub(cap)],
    [c.cPool, pool, c.cPoolSub],
  ];

  return (
    <>
      <h4>{ui.calcHeading}</h4>
      <div className="calc">
        <div className="row">
          <label>
            {c.rpsPeak}
            <input type="number" min={1} value={rps} onChange={(e) => setRps(+e.target.value)} />
          </label>
          <label>
            {c.p95}
            <input type="number" min={1} value={lat} onChange={(e) => setLat(+e.target.value)} />
          </label>
          <label>
            {c.cores}
            <input type="number" min={1} value={core} onChange={(e) => setCore(+e.target.value)} />
          </label>
          <label>
            {c.capNode}
            <input type="number" min={1} value={cap} onChange={(e) => setCap(+e.target.value)} />
          </label>
        </div>
        <div className="out">
          {cells.map(([l, v, s]) => (
            <div className="cell" key={l}>
              <div className="cl">{l}</div>
              <div className="cv">{v}</div>
              <div className="cs">{s}</div>
            </div>
          ))}
        </div>
        <p className="note">{c.note}</p>
      </div>
    </>
  );
}
