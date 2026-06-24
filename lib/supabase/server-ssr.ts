import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

export async function createServerSupabaseClient() {
  const { url, publishableKey } = getSupabaseEnv();
  if (!url || !publishableKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 set 불가 — middleware가 세션 갱신
        }
      },
    },
  });
}
