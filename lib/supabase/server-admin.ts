import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

let adminClient: SupabaseClient<Database> | null = null;

function cleanEnvValue(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

/** RLS 우회용 service role (서버 전용). .env.local에 SUPABASE_SERVICE_ROLE_KEY 설정 */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  const serviceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!serviceRoleKey) return null;

  if (adminClient) return adminClient;

  const { url } = getSupabaseEnv();
  if (!url) return null;

  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return adminClient;
}

/** 서버에서 users 쓰기 — service role 우선, 없으면 publishable key */
export function getSupabaseServer(): SupabaseClient<Database> | null {
  const admin = getSupabaseAdmin();
  if (admin) return admin;

  const { url, publishableKey } = getSupabaseEnv();
  if (!url || !publishableKey) return null;

  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
