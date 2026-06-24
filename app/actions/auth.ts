"use server";

import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server-ssr";

const LEGACY_USER_ID_COOKIE = "pick-ranking-user-id";

/** Supabase Auth 쿠키 + 레거시 닉네임 쿠키 제거 */
export async function signOutServer(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // 클라이언트 signOut으로 이미 종료된 경우 무시
  }

  const store = await cookies();
  store.delete(LEGACY_USER_ID_COOKIE);
}
