import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// Magic link trỏ về đây: /auth/callback?code=... → đổi code lấy session (cookie).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await getServerSupabase();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
