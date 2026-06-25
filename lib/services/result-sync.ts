/**
 * @deprecated `lib/sync` 사용 — 하위 호환 re-export
 */
export type { SyncResultSummary, LeagueSyncSummary } from "@/lib/sync/types";
export {
  SYNC_INTERVAL_MS,
  syncAll,
  syncLeague,
  syncGameResults,
  syncGameResultsIfNeeded,
  refreshRankingSnapshot,
} from "@/lib/sync/orchestrator";
