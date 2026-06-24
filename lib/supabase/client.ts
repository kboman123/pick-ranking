import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { createBrowserSupabaseClient } from "./browser";
import {
  getSupabaseEnvErrorMessage,
  isSupabaseConfigured,
} from "./env";

/** Re-enable when Realtime postgres_changes subscriptions are wired up again. */
const REALTIME_ENABLED = false;

export function getSupabase(): SupabaseClient<Database> {
  return createBrowserSupabaseClient();
}

export function subscribeToTable(
  _table: "games" | "predictions" | "users",
  _onChange: () => void,
): () => void {
  if (!REALTIME_ENABLED || !isSupabaseConfigured()) {
    return () => {};
  }

  const supabase = getSupabase();
  const channel = supabase
    .channel(`pick-ranking:${_table}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: _table },
      () => _onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export { isSupabaseConfigured, getSupabaseEnvErrorMessage };
