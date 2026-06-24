import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createBrowserSupabaseClient() {
  if (client) return client;

  const { url, publishableKey } = getSupabaseEnv();
  if (!url || !publishableKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  client = createBrowserClient<Database>(url, publishableKey);
  return client;
}

/** 로그아웃 후 캐시된 클라이언트 제거 */
export function resetBrowserSupabaseClient(): void {
  client = null;
}
