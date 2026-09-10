import { NODES, TIERS, RANKS, type Lang, type SkillNode, type Tier } from "./content";
import { NODES_EN, TIERS_EN, RANKS_EN } from "./content.en";

export type { Lang };

export const LANGS: Lang[] = ["vi", "en"];

export function getData(lang: Lang): {
  nodes: SkillNode[];
  tiers: Tier[];
  ranks: [number, string][];
} {
  return lang === "en"
    ? { nodes: NODES_EN, tiers: TIERS_EN, ranks: RANKS_EN }
    : { nodes: NODES, tiers: TIERS, ranks: RANKS };
}

export type UIStrings = {
  eyebrow: string;
  h1: string;
  tagline: string;
  rank: string;
  xp: string;
  progress: string;
  reset: string;
  resetConfirm: string;
  resetDone: string;
  legendLocked: string;
  legendAvail: string;
  legendCleared: string;
  intro: string;
  statusLocked: string;
  statusAvail: string;
  statusCleared: string;
  needPrefix: string;
  lockToast: (list: string) => string;
  clearToast: (id: string, xp: number, newly: string[]) => string;
  whatIs: string;
  whenUse: string;
  pros: string;
  cons: string;
  questions: string;
  lab: string;
  sources: string;
  calcHeading: string;
  revealShow: string;
  revealHide: string;
  clearBtn: (xp: number) => string;
  clearedBtn: string;
  xpEarned: (xp: number) => string;
  clearHint: string;
  qLabel: (i: number) => string;
  calc: {
    rpsPeak: string;
    p95: string;
    cores: string;
    capNode: string;
    cInflight: string;
    cInflightSub: string;
    cWorker: string;
    cWorkerSub: string;
    cNodes: string;
    cNodesSub: (cap: number) => string;
    cPool: string;
    cPoolSub: string;
    note: string;
  };
  auth: {
    localPill: string;
    localMsg: string;
    syncedPill: string;
    syncingPill: string;
    signedIn: (email: string) => string;
    signOut: string;
    notSignedPill: string;
    prompt: string;
    send: string;
    sending: string;
    sent: (email: string) => string;
    errorPrefix: (msg: string) => string;
    emailPlaceholder: string;
    syncedLabel: string;
    syncingLabel: string;
    localLabel: string;
  };
};

export const UI: Record<Lang, UIStrings> = {
  vi: {
    eyebrow: "Solution Architect · Career Track",
    h1: "Skill Tree: Dựng hệ Edtech cho 10M người dùng",
    tagline: "Clear từng node → mở khóa node liên quan → hạ Boss cuối.",
    rank: "Rank",
    xp: "XP",
    progress: "Tiến độ",
    reset: "Reset tiến độ",
    resetConfirm: "Xóa toàn bộ tiến độ đã clear?",
    resetDone: "Đã reset tiến độ.",
    legendLocked: "Đang khóa",
    legendAvail: "Có thể học",
    legendCleared: "Đã clear",
    intro:
      "Đây là lộ trình tự học có <b>cơ chế khóa</b>: mỗi node là một mảng kiến thức (lý thuyết · khi nào dùng · ưu/nhược · câu hỏi + đáp án gợi ý · lab · nguồn tiếng Anh uy tín). Hoàn thành node sẽ <b>mở khóa</b> các node phụ thuộc. Ba node <b>Tổng hợp/Boss</b> chỉ mở khi bạn đã nắm các mảnh ghép liên quan — đó là lúc bạn học cách <b>lắp ghép</b> chúng lại.",
    statusLocked: "Đang khóa",
    statusAvail: "Có thể học",
    statusCleared: "Đã clear",
    needPrefix: "Cần:",
    lockToast: (list) => `🔒 Cần clear trước: <b>${list}</b>`,
    clearToast: (id, xp, newly) =>
      `✓ Clear <b>${id}</b> +${xp} XP.` + (newly.length ? ` Mở khóa: <b>${newly.join(", ")}</b>` : ""),
    whatIs: "Là gì / Cách hoạt động",
    whenUse: "Khi nào nên / không nên dùng",
    pros: "Ưu điểm",
    cons: "Nhược điểm",
    questions: "Câu hỏi kiểm tra & đáp án gợi ý",
    lab: "Lab thực hành",
    sources: "Nguồn đọc thêm (EN, chọn lọc)",
    calcHeading: "Máy tính Capacity (Little's Law + headroom)",
    revealShow: "Xem đáp án gợi ý ▾",
    revealHide: "Ẩn đáp án ▴",
    clearBtn: (xp) => `Đánh dấu ĐÃ CLEAR (+${xp} XP)`,
    clearedBtn: "✓ Đã clear node này",
    xpEarned: (xp) => `+${xp} XP đã nhận`,
    clearHint: "Nên đọc lý thuyết + thử trả lời câu hỏi trước",
    qLabel: (i) => `Q${i}.`,
    calc: {
      rpsPeak: "RPS peak",
      p95: "p95 latency (ms)",
      cores: "CPU cores / node",
      capNode: "Cap / node (req/s)",
      cInflight: "In-flight (L=λ×W)",
      cInflightSub: "request đồng thời",
      cWorker: "Worker/slot (70%)",
      cWorkerSub: "đã cộng headroom",
      cNodes: "Số node (N+1)",
      cNodesSub: (cap) => `@${cap} rps/node, 70%`,
      cPool: "DB pool / node",
      cPoolSub: "nhỏ + PgBouncer",
      note:
        "Quy tắc: giữ utilization ~70% (không 100%), luôn +1 node dự phòng (N+1). Pool DB nhỏ + PgBouncer thay vì pool khổng lồ. Đổi latency 2× để thấy nhu cầu cấu hình nhảy — lý do phải load test trước khi chốt.",
    },
    auth: {
      localPill: "Local-only",
      localMsg:
        "Chưa cấu hình Supabase — tiến độ đang lưu trên <b>trình duyệt này</b>. Thêm biến môi trường Supabase để bật đăng nhập + đồng bộ đa thiết bị (xem README).",
      syncedPill: "synced",
      syncingPill: "syncing",
      signedIn: (email) => `Đăng nhập: <b>${email}</b> — tiến độ đồng bộ lên Supabase.`,
      signOut: "Đăng xuất",
      notSignedPill: "Chưa đăng nhập",
      prompt: "Nhập email để nhận magic link đăng nhập — tiến độ sẽ đồng bộ đa thiết bị.",
      send: "Gửi magic link",
      sending: "Đang gửi…",
      sent: (email) => `Đã gửi magic link tới ${email}. Kiểm tra email!`,
      errorPrefix: (msg) => `Lỗi: ${msg}`,
      emailPlaceholder: "ban@email.com",
      syncedLabel: "Đã đồng bộ",
      syncingLabel: "Đang đồng bộ…",
      localLabel: "Local",
    },
  },
  en: {
    eyebrow: "Solution Architect · Career Track",
    h1: "Skill Tree: Build Edtech for 10M users",
    tagline: "Clear each node → unlock related nodes → beat the final Boss.",
    rank: "Rank",
    xp: "XP",
    progress: "Progress",
    reset: "Reset progress",
    resetConfirm: "Clear all cleared progress?",
    resetDone: "Progress reset.",
    legendLocked: "Locked",
    legendAvail: "Available",
    legendCleared: "Cleared",
    intro:
      "A self-study path with a <b>lock mechanism</b>: each node is a knowledge block (theory · when to use · pros/cons · questions + suggested answers · lab · curated sources). Completing a node <b>unlocks</b> its dependents. The three <b>Synthesis/Boss</b> nodes open only once you've grasped the related pieces — that's when you learn to <b>assemble</b> them.",
    statusLocked: "Locked",
    statusAvail: "Available",
    statusCleared: "Cleared",
    needPrefix: "Requires:",
    lockToast: (list) => `🔒 Clear these first: <b>${list}</b>`,
    clearToast: (id, xp, newly) =>
      `✓ Cleared <b>${id}</b> +${xp} XP.` + (newly.length ? ` Unlocked: <b>${newly.join(", ")}</b>` : ""),
    whatIs: "What it is / How it works",
    whenUse: "When to use / not use",
    pros: "Pros",
    cons: "Cons",
    questions: "Self-check questions & suggested answers",
    lab: "Hands-on lab",
    sources: "Further reading (curated)",
    calcHeading: "Capacity calculator (Little's Law + headroom)",
    revealShow: "Show suggested answer ▾",
    revealHide: "Hide answer ▴",
    clearBtn: (xp) => `Mark as CLEARED (+${xp} XP)`,
    clearedBtn: "✓ This node is cleared",
    xpEarned: (xp) => `+${xp} XP earned`,
    clearHint: "Read the theory + try the questions first",
    qLabel: (i) => `Q${i}.`,
    calc: {
      rpsPeak: "Peak RPS",
      p95: "p95 latency (ms)",
      cores: "CPU cores / node",
      capNode: "Cap / node (req/s)",
      cInflight: "In-flight (L=λ×W)",
      cInflightSub: "concurrent requests",
      cWorker: "Worker/slot (70%)",
      cWorkerSub: "headroom included",
      cNodes: "Nodes (N+1)",
      cNodesSub: (cap) => `@${cap} rps/node, 70%`,
      cPool: "DB pool / node",
      cPoolSub: "small + PgBouncer",
      note:
        "Rule of thumb: keep utilization ~70% (never 100%), always +1 spare node (N+1). Small DB pool + PgBouncer instead of a huge pool. Double the latency to see the config demand jump — why you must load-test before locking config.",
    },
    auth: {
      localPill: "Local-only",
      localMsg:
        "Supabase not configured — progress is saved in <b>this browser</b>. Add the Supabase env vars to enable login + multi-device sync (see README).",
      syncedPill: "synced",
      syncingPill: "syncing",
      signedIn: (email) => `Signed in: <b>${email}</b> — progress synced to Supabase.`,
      signOut: "Sign out",
      notSignedPill: "Not signed in",
      prompt: "Enter your email to get a magic sign-in link — progress will sync across devices.",
      send: "Send magic link",
      sending: "Sending…",
      sent: (email) => `Magic link sent to ${email}. Check your inbox!`,
      errorPrefix: (msg) => `Error: ${msg}`,
      emailPlaceholder: "you@email.com",
      syncedLabel: "Synced",
      syncingLabel: "Syncing…",
      localLabel: "Local",
    },
  },
};
