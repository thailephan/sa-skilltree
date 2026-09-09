"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

const LS_KEY = "sa-skilltree-v1";

function loadLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(ids: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota errors */
  }
}

export type ProgressState = {
  cleared: Set<string>;
  clearNode: (id: string) => void;
  reset: () => void;
  user: User | null;
  status: "local" | "syncing" | "synced";
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

export function useProgress(): ProgressState {
  const [cleared, setCleared] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<ProgressState["status"]>("local");
  const supabaseRef = useRef(isSupabaseConfigured ? getBrowserSupabase() : null);

  // Ghi DB (chỉ khi đã đăng nhập). Bọc trong ref để tránh re-create.
  const pushRemote = useCallback(async (ids: string[]) => {
    const supabase = supabaseRef.current;
    if (!supabase || !user) return;
    await supabase
      .from("user_progress")
      .upsert({ user_id: user.id, cleared: ids, updated_at: new Date().toISOString() });
  }, [user]);

  // Khởi tạo từ localStorage ngay lập tức.
  useEffect(() => {
    setCleared(new Set(loadLocal()));
  }, []);

  // Theo dõi phiên đăng nhập.
  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Khi đăng nhập: merge local + remote (union), ghi ngược lại cả hai.
  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase || !user) {
      if (isSupabaseConfigured) setStatus("local");
      return;
    }
    let active = true;
    setStatus("syncing");
    (async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("cleared")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      const remote: string[] = data?.cleared ?? [];
      const local = loadLocal();
      const merged = Array.from(new Set([...remote, ...local]));
      setCleared(new Set(merged));
      saveLocal(merged);
      await supabase
        .from("user_progress")
        .upsert({ user_id: user.id, cleared: merged, updated_at: new Date().toISOString() });
      if (active) setStatus("synced");
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const clearNode = useCallback((id: string) => {
    setCleared((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      const ids = Array.from(next);
      saveLocal(ids);
      void pushRemote(ids);
      return next;
    });
  }, [pushRemote]);

  const reset = useCallback(() => {
    setCleared(new Set());
    saveLocal([]);
    void pushRemote([]);
  }, [pushRemote]);

  const signIn = useCallback(async (email: string) => {
    const supabase = supabaseRef.current;
    if (!supabase) return { error: "Supabase chưa được cấu hình." };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setStatus("local");
  }, []);

  return { cleared, clearNode, reset, user, status, signIn, signOut };
}
