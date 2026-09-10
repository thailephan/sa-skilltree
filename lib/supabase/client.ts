"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// App chạy được cả khi CHƯA cấu hình Supabase (chế độ local-only).
export const isSupabaseConfigured = Boolean(url && anon);

// Singleton để nhiều hook dùng chung 1 client (tránh cảnh báo "Multiple GoTrueClient").
let cached: SupabaseClient | null = null;

export function getBrowserSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!cached) cached = createBrowserClient(url as string, anon as string);
  return cached;
}
