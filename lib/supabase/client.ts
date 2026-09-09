"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// App chạy được cả khi CHƯA cấu hình Supabase (chế độ local-only).
export const isSupabaseConfigured = Boolean(url && anon);

export function getBrowserSupabase() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(url as string, anon as string);
}
