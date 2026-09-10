"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SkillNode } from "@/lib/content";

const LS_KEY = "sa-quiz-v1";
const DAY = 86_400_000;
// Lịch giãn ôn theo streak (spaced repetition nhẹ): lần đúng thứ n → ôn lại sau X ngày.
const INTERVALS_DAYS = [1, 3, 7, 21, 60];

export type ReviewItem = { streak: number; reps: number; last: 0 | 1; due: number };
type ReviewMap = Record<string, ReviewItem>;

export const qkey = (nodeId: string, qIdx: number) => `${nodeId}#${qIdx}`;

function loadLocal(): ReviewMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveLocal(m: ReviewMap) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(m));
  } catch {}
}

function nextItem(prev: ReviewItem | undefined, correct: boolean, now: number): ReviewItem {
  const reps = (prev?.reps ?? 0) + 1;
  if (!correct) return { streak: 0, reps, last: 0, due: now }; // ôn lại ngay
  const streak = (prev?.streak ?? 0) + 1;
  const days = INTERVALS_DAYS[Math.min(streak, INTERVALS_DAYS.length) - 1];
  return { streak, reps, last: 1, due: now + days * DAY };
}

export type QueueEntry = { nodeId: string; qIdx: number };

export type QuizState = {
  ready: boolean;
  grade: (nodeId: string, qIdx: number, correct: boolean, now?: number) => void;
  buildQueue: (nodes: SkillNode[], cleared: Set<string>, now?: number) => QueueEntry[];
  stats: (nodes: SkillNode[], cleared: Set<string>, now?: number) => {
    due: number;
    mastered: number;
    weak: number;
    total: number;
  };
};

export function useQuiz(user: User | null): QuizState {
  const [reviews, setReviews] = useState<ReviewMap>({});
  const [ready, setReady] = useState(false);
  const supabaseRef = useRef(isSupabaseConfigured ? getBrowserSupabase() : null);

  useEffect(() => {
    setReviews(loadLocal());
    setReady(true);
  }, []);

  // Đồng bộ khi đăng nhập: merge local + remote (remote ưu tiên khi trùng key).
  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase || !user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("quiz_reviews")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      const remote: ReviewMap = data?.data ?? {};
      const merged = { ...loadLocal(), ...remote };
      setReviews(merged);
      saveLocal(merged);
      await supabase
        .from("quiz_reviews")
        .upsert({ user_id: user.id, data: merged, updated_at: new Date().toISOString() });
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const pushRemote = useCallback(
    async (m: ReviewMap) => {
      const supabase = supabaseRef.current;
      if (!supabase || !user) return;
      await supabase
        .from("quiz_reviews")
        .upsert({ user_id: user.id, data: m, updated_at: new Date().toISOString() });
    },
    [user]
  );

  const grade = useCallback(
    (nodeId: string, qIdx: number, correct: boolean, now = Date.now()) => {
      setReviews((prev) => {
        const key = qkey(nodeId, qIdx);
        const next = { ...prev, [key]: nextItem(prev[key], correct, now) };
        saveLocal(next);
        void pushRemote(next);
        return next;
      });
    },
    [pushRemote]
  );

  const buildQueue = useCallback(
    (nodes: SkillNode[], cleared: Set<string>, now = Date.now()): QueueEntry[] => {
      const entries: (QueueEntry & { order: number })[] = [];
      for (const n of nodes) {
        if (!cleared.has(n.id)) continue; // chỉ ôn node đã clear
        n.questions.forEach((_q, qIdx) => {
          const it = reviews[qkey(n.id, qIdx)];
          if (!it) {
            entries.push({ nodeId: n.id, qIdx, order: 1 }); // câu mới
          } else if (it.due <= now) {
            entries.push({ nodeId: n.id, qIdx, order: it.last === 0 ? 0 : 2 }); // sai gần đây lên đầu
          }
        });
      }
      // sai (0) → mới (1) → tới hạn (2)
      return entries.sort((a, b) => a.order - b.order).map(({ nodeId, qIdx }) => ({ nodeId, qIdx }));
    },
    [reviews]
  );

  const stats = useCallback(
    (nodes: SkillNode[], cleared: Set<string>, now = Date.now()) => {
      let due = 0,
        mastered = 0,
        weak = 0,
        total = 0;
      for (const n of nodes) {
        if (!cleared.has(n.id)) continue;
        n.questions.forEach((_q, qIdx) => {
          total++;
          const it = reviews[qkey(n.id, qIdx)];
          if (!it || it.due <= now) due++;
          if (it && it.streak >= 3) mastered++;
          if (it && it.last === 0) weak++;
        });
      }
      return { due, mastered, weak, total };
    },
    [reviews]
  );

  return { ready, grade, buildQueue, stats };
}
