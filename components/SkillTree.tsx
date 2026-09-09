"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NODES, TIERS, RANKS, type SkillNode } from "@/lib/content";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useProgress } from "@/lib/useProgress";

function rankFor(xp: number): [number, string] {
  let r = RANKS[0];
  for (const x of RANKS) if (xp >= x[0]) r = x;
  return r;
}

export default function SkillTree() {
  const { cleared, clearNode, reset, user, status, signIn, signOut } = useProgress();
  const [selected, setSelected] = useState<SkillNode | null>(null);
  const [toast, setToast] = useState<{ html: string; show: boolean }>({ html: "", show: false });
  const [shakeId, setShakeId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    [cleared]
  );
  const doneCount = useMemo(() => NODES.filter((n) => cleared.has(n.id)).length, [cleared]);
  const rank = rankFor(xp);
  const rankIdx = RANKS.findIndex((r) => r[1] === rank[1]);
  const nextRank = RANKS[rankIdx + 1];
  const barPct = nextRank
    ? Math.min(100, Math.round(((xp - rank[0]) / (nextRank[0] - rank[0])) * 100))
    : 100;

  const onCardClick = (n: SkillNode) => {
    const avail = isAvailable(n);
    const done = isCleared(n.id);
    if (!avail && !done) {
      setShakeId(null);
      requestAnimationFrame(() => setShakeId(n.id));
      showToast(`🔒 Cần clear trước: <b>${missing(n).join(", ")}</b>`);
      return;
    }
    setSelected(n);
  };

  const onClear = (n: SkillNode) => {
    if (cleared.has(n.id)) return;
    const before = new Set(
      NODES.filter((x) => isAvailable(x) && !isCleared(x.id)).map((x) => x.id)
    );
    clearNode(n.id);
    // Tính node mới mở khóa (dựa trên tập cleared sau khi thêm n).
    const nextCleared = new Set(cleared);
    nextCleared.add(n.id);
    const nowAvail = NODES.filter(
      (x) => x.prereq.every((p) => nextCleared.has(p)) && !nextCleared.has(x.id)
    ).map((x) => x.id);
    const newly = nowAvail.filter((id) => !before.has(id));
    let msg = `✓ Clear <b>${n.id}</b> +${n.xp} XP.`;
    if (newly.length) msg += ` Mở khóa: <b>${newly.join(", ")}</b>`;
    showToast(msg);
    setSelected(null);
  };

  // Đóng drawer bằng Escape.
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
            <span className="eyebrow">Solution Architect · Career Track</span>
            <h1>Skill Tree: Dựng hệ Edtech cho 10M người dùng</h1>
            <p>Clear từng node → mở khóa node liên quan → hạ Boss cuối.</p>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="k">Rank</span>
              <span className="v gold">Lv {rankIdx + 1}</span>
              <span className="rank">{rank[1]}</span>
            </div>
            <div className="stat">
              <span className="k">XP</span>
              <span className="v">{xp}</span>
              <div className="bar" style={{ marginTop: 4 }}>
                <i style={{ width: `${barPct}%` }} />
              </div>
            </div>
            <div className="stat">
              <span className="k">Tiến độ</span>
              <span className="v mint">
                {doneCount} / {NODES.length}
              </span>
            </div>
            <button
              className="btn"
              onClick={() => {
                if (confirm("Xóa toàn bộ tiến độ đã clear?")) {
                  reset();
                  showToast("Đã reset tiến độ.");
                }
              }}
            >
              Reset tiến độ
            </button>
          </div>
        </div>

        <AuthBar
          configured={isSupabaseConfigured}
          email={user?.email ?? null}
          status={status}
          onSignIn={signIn}
          onSignOut={signOut}
        />

        <p className="intro">
          Đây là lộ trình tự học có <b>cơ chế khóa</b>: mỗi node là một mảng kiến thức (lý thuyết ·
          khi nào dùng · ưu/nhược · câu hỏi + đáp án gợi ý · lab · nguồn tiếng Anh uy tín). Hoàn thành
          node sẽ <b>mở khóa</b> các node phụ thuộc. Ba node <b>Tổng hợp/Boss</b> chỉ mở khi bạn đã nắm
          các mảnh ghép liên quan — đó là lúc bạn học cách <b>lắp ghép</b> chúng lại.
        </p>

        <div className="legend">
          <span>
            <i className="dot l" /> Đang khóa
          </span>
          <span>
            <i className="dot a" /> Có thể học
          </span>
          <span>
            <i className="dot c" /> Đã clear
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
                  const statusTxt = done ? "Đã clear" : avail ? "Có thể học" : "Đang khóa";
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
                          <span className="lockmsg">Cần: {missing(n).join(" · ")}</span>
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

      <div
        className={`overlay${selected ? " open" : ""}`}
        onClick={() => setSelected(null)}
      />
      <Drawer node={selected} cleared={selected ? isCleared(selected.id) : false} onClose={() => setSelected(null)} onClear={onClear} />

      <div className={`toast${toast.show ? " show" : ""}`} dangerouslySetInnerHTML={{ __html: toast.html }} />
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
}: {
  configured: boolean;
  email: string | null;
  status: "local" | "syncing" | "synced";
  onSignIn: (email: string) => Promise<{ error: string | null }>;
  onSignOut: () => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!configured) {
    return (
      <div className="authbar">
        <span className="pill local">Local-only</span>
        <span className="msg">
          Chưa cấu hình Supabase — tiến độ đang lưu trên <b>trình duyệt này</b>. Thêm biến môi trường
          Supabase để bật đăng nhập + đồng bộ đa thiết bị (xem README).
        </span>
      </div>
    );
  }

  if (email) {
    const pill = status === "synced" ? "synced" : status === "syncing" ? "syncing" : "local";
    const label = status === "synced" ? "Đã đồng bộ" : status === "syncing" ? "Đang đồng bộ…" : "Local";
    return (
      <div className="authbar">
        <span className={`pill ${pill}`}>{label}</span>
        <span className="msg">
          Đăng nhập: <b>{email}</b> — tiến độ đồng bộ lên Supabase.
        </span>
        <form onSubmit={(e) => { e.preventDefault(); void onSignOut(); }}>
          <button className="btn" type="submit">Đăng xuất</button>
        </form>
      </div>
    );
  }

  return (
    <div className="authbar">
      <span className="pill local">Chưa đăng nhập</span>
      <span className="msg">
        {msg ?? "Nhập email để nhận magic link đăng nhập — tiến độ sẽ đồng bộ đa thiết bị."}
      </span>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!value) return;
          setSending(true);
          const { error } = await onSignIn(value);
          setSending(false);
          setMsg(error ? `Lỗi: ${error}` : `Đã gửi magic link tới ${value}. Kiểm tra email!`);
        }}
      >
        <input
          type="email"
          required
          placeholder="ban@email.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn" type="submit" disabled={sending}>
          {sending ? "Đang gửi…" : "Gửi magic link"}
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
}: {
  node: SkillNode | null;
  cleared: boolean;
  onClose: () => void;
  onClear: (n: SkillNode) => void;
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
            <button className="d-close" aria-label="Đóng" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="d-body">
            <h4>Là gì / Cách hoạt động</h4>
            <div dangerouslySetInnerHTML={{ __html: node.theory }} />
            <h4>Khi nào nên / không nên dùng</h4>
            <div dangerouslySetInnerHTML={{ __html: node.whenUse }} />
            <div className="prosbox">
              <div className="pro">
                <h5>Ưu điểm</h5>
                <ul>{node.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
              <div className="con">
                <h5>Nhược điểm</h5>
                <ul>{node.cons.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            </div>

            {node.calc && <Calculator />}

            <h4>Câu hỏi kiểm tra &amp; đáp án gợi ý</h4>
            {node.questions.map((q, i) => (
              <div className="q" key={i}>
                <p className="qq">
                  <b>Q{i + 1}.</b> {q.q}
                </p>
                <button
                  className="reveal"
                  onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                >
                  {open[i] ? "Ẩn đáp án ▴" : "Xem đáp án gợi ý ▾"}
                </button>
                {open[i] && <div className="ans" dangerouslySetInnerHTML={{ __html: q.a }} />}
              </div>
            ))}

            <h4>Lab thực hành</h4>
            <div className="lab" dangerouslySetInnerHTML={{ __html: node.lab }} />

            <h4>Nguồn đọc thêm (EN, chọn lọc)</h4>
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
                  ✓ Đã clear node này
                </button>
                <span className="prereq-note">+{node.xp} XP đã nhận</span>
              </>
            ) : (
              <>
                <button className="clearbtn" onClick={() => onClear(node)}>
                  Đánh dấu ĐÃ CLEAR (+{node.xp} XP)
                </button>
                <span className="prereq-note">Nên đọc lý thuyết + thử trả lời câu hỏi trước</span>
              </>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

/* ---------------- Capacity calculator ---------------- */
function Calculator() {
  const [rps, setRps] = useState(6000);
  const [lat, setLat] = useState(150);
  const [core, setCore] = useState(4);
  const [cap, setCap] = useState(800);

  const inflight = Math.round(rps * (lat / 1000));
  const workers = Math.ceil(inflight / 0.7);
  const nodes = Math.ceil(rps / (cap * 0.7)) + 1;
  const pool = core * 2 + 1;

  const cells: [string, number | string, string][] = [
    ["In-flight (L=λ×W)", inflight, "request đồng thời"],
    ["Worker/slot (70%)", workers, "đã cộng headroom"],
    ["Số node (N+1)", nodes, `@${cap} rps/node, 70%`],
    ["DB pool / node", pool, "nhỏ + PgBouncer"],
  ];

  return (
    <>
      <h4>Máy tính Capacity (Little&apos;s Law + headroom)</h4>
      <div className="calc">
        <div className="row">
          <label>
            RPS peak
            <input type="number" min={1} value={rps} onChange={(e) => setRps(+e.target.value)} />
          </label>
          <label>
            p95 latency (ms)
            <input type="number" min={1} value={lat} onChange={(e) => setLat(+e.target.value)} />
          </label>
          <label>
            CPU cores / node
            <input type="number" min={1} value={core} onChange={(e) => setCore(+e.target.value)} />
          </label>
          <label>
            Cap / node (req/s)
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
        <p className="note">
          Quy tắc: giữ utilization ~70% (không 100%), luôn +1 node dự phòng (N+1). Pool DB nhỏ +
          PgBouncer thay vì pool khổng lồ. Đổi latency 2× để thấy nhu cầu cấu hình nhảy — lý do phải
          load test trước khi chốt.
        </p>
      </div>
    </>
  );
}
