import type { LeagueCode } from "@/lib/domain/league";

export type SyncResultSummary = {
  /** Provider에서 조회한 외부 경기 수 */
  checked: number;
  /** 신규 DB INSERT 건수 */
  created: number;
  /** 기존 경기 UPDATE 건수 */
  updated: number;
  finished: number;
  predictionsEvaluated: number;
  rankingRefreshed: boolean;
  skipped?: boolean;
  errors: string[];
  leagues: LeagueSyncSummary[];
};

export type LeagueSyncSummary = {
  league: LeagueCode;
  checked: number;
  created: number;
  updated: number;
  finished: number;
  predictionsEvaluated: number;
  errors: string[];
};

export const SYNC_INTERVAL_MS = 2 * 60 * 1000;

export function emptySyncSummary(): SyncResultSummary {
  return {
    checked: 0,
    created: 0,
    updated: 0,
    finished: 0,
    predictionsEvaluated: 0,
    rankingRefreshed: false,
    errors: [],
    leagues: [],
  };
}

export function emptyLeagueSummary(league: LeagueCode): LeagueSyncSummary {
  return {
    league,
    checked: 0,
    created: 0,
    updated: 0,
    finished: 0,
    predictionsEvaluated: 0,
    errors: [],
  };
}
