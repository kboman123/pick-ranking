import type { DbGame } from "./database.types";
import { createBrowserSupabaseClient } from "./browser";
import {
  getSupabaseEnvErrorMessage,
  isSupabaseConfigured,
} from "./env";

export type GameRowChange = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: DbGame | null;
  old: DbGame | null;
};

/** Phase 3: Realtime 기본 ON. 롤백 시 NEXT_PUBLIC_REALTIME_ENABLED=false */
export function isRealtimeEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_REALTIME_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return true;
}

export function getSupabase() {
  return createBrowserSupabaseClient();
}

/** games 행 단위 Realtime — 점수·상태·이닝 즉시 패치용 */
export function subscribeToGames(
  onChange: (change: GameRowChange) => void,
): () => void {
  if (!isRealtimeEnabled() || !isSupabaseConfigured()) {
    return () => {};
  }

  const supabase = getSupabase();
  const channel = supabase
    .channel("pick-ranking:games-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "games" },
      (payload) => {
        onChange({
          eventType: payload.eventType as GameRowChange["eventType"],
          new: (payload.new as DbGame | undefined) ?? null,
          old: (payload.old as DbGame | undefined) ?? null,
        });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** 테이블 변경 시 full refresh (ranking, opinions 등) */
export function subscribeToTable(
  table: "games" | "predictions" | "users",
  onChange: () => void,
): () => void {
  if (!isRealtimeEnabled() || !isSupabaseConfigured()) {
    return () => {};
  }

  const supabase = getSupabase();
  const channel = supabase
    .channel(`pick-ranking:${table}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export { isSupabaseConfigured, getSupabaseEnvErrorMessage };
