import type { LeagueCode } from "@/lib/domain/league";
import { BASEBALL_LEAGUES } from "@/lib/domain/league";
import { isExternalGameFinished } from "@/lib/domain/external-game";
import { getProviderRegistry } from "@/lib/providers/registry";
import { getSupabaseAdmin } from "@/lib/supabase/server-admin";
import {
  formatDateKst,
  getKstDayBounds,
  getTodayKst,
  getYesterdayKst,
  isScheduledOnKstDate,
} from "./dates";
import { buildGameIndex, findExistingGame, type IndexedGame } from "./game-index";
import { buildGameWritePayload } from "./game-updater";
import { evaluatePredictionsForGames } from "./prediction-evaluator";
import { getLatestSyncedAt, refreshRankingSnapshot } from "./ranking";
import {
  emptyLeagueSummary,
  emptySyncSummary,
  SYNC_INTERVAL_MS,
  type LeagueSyncSummary,
  type SyncResultSummary,
} from "./types";

const GAME_SELECT =
  "id, sport, home_team, away_team, scheduled_at, result, status, api_sports_game_id";

async function loadGamesForLeagueWindow(
  league: LeagueCode,
  dates: string[],
): Promise<IndexedGame[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const bounds = dates.map(getKstDayBounds);
  const start = bounds[0]?.start;
  const end = bounds[bounds.length - 1]?.end;
  if (!start || !end) return [];

  const { data, error } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .eq("sport", league)
    .gte("scheduled_at", start)
    .lte("scheduled_at", end);

  if (error || !data) return [];
  return data as IndexedGame[];
}

/**
 * 리그별 동기화
 * - 오늘(KST) 경기 자동 등록 (중복 없음)
 * - Live/Finished/Cancelled/Postponed 상태·점수 반영
 */
export async function syncLeague(
  league: LeagueCode,
  today = getTodayKst(),
): Promise<LeagueSyncSummary> {
  const summary = emptyLeagueSummary(league);
  const registry = getProviderRegistry();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    summary.errors.push("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
    return summary;
  }

  if (!registry.isLeagueSupported(league)) {
    summary.errors.push(`${league}: 지원하지 않는 리그입니다.`);
    return summary;
  }

  const yesterday = getYesterdayKst(today);
  const fetchDates = [yesterday, today];

  let externalGames;
  try {
    externalGames = await registry.fetchGamesForLeague(league, fetchDates);
  } catch (error) {
    summary.errors.push(
      `${league} Provider 조회 실패: ${error instanceof Error ? error.message : String(error)}`,
    );
    return summary;
  }

  summary.checked = externalGames.length;

  const dbGames = await loadGamesForLeagueWindow(league, fetchDates);
  const index = buildGameIndex(dbGames);
  const finishedGameIds: string[] = [];
  const syncedAt = new Date().toISOString();

  for (const external of externalGames) {
    try {
      const isTodayGame = isScheduledOnKstDate(external.scheduledAt, today);
      const existing = findExistingGame(external, index);

      if (!existing) {
        if (!isTodayGame) continue;

        const payload = buildGameWritePayload(external, syncedAt);
        const { data: inserted, error } = await supabase
          .from("games")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          if (error.code === "23505") continue;
          summary.errors.push(`${league} INSERT: ${error.message}`);
          continue;
        }

        summary.created += 1;
        if (inserted && isExternalGameFinished(external)) {
          summary.finished += 1;
          finishedGameIds.push(inserted.id);
        }
        continue;
      }

      const payload = buildGameWritePayload(external, syncedAt);
      const { error } = await supabase
        .from("games")
        .update(payload)
        .eq("id", existing.id);

      if (error) {
        summary.errors.push(`${existing.id}: ${error.message}`);
        continue;
      }

      summary.updated += 1;
      if (isExternalGameFinished(external) && payload.result) {
        summary.finished += 1;
        finishedGameIds.push(existing.id);
      }
    } catch (error) {
      summary.errors.push(
        `${league}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  summary.predictionsEvaluated = await evaluatePredictionsForGames(
    supabase,
    finishedGameIds,
  );

  return summary;
}

/** KBO · NPB · MLB 전체 동기화 (Cron / Admin) */
export async function syncAll(today = getTodayKst()): Promise<SyncResultSummary> {
  const summary = emptySyncSummary();
  const registry = getProviderRegistry();

  if (!registry.isAnyProviderConfigured()) {
    summary.errors.push("API_BASEBALL_KEY 환경변수가 설정되지 않았습니다.");
    return summary;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    summary.errors.push("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
    return summary;
  }

  for (const league of BASEBALL_LEAGUES) {
    const leagueSummary = await syncLeague(league, today);
    summary.leagues.push(leagueSummary);
    summary.checked += leagueSummary.checked;
    summary.created += leagueSummary.created;
    summary.updated += leagueSummary.updated;
    summary.finished += leagueSummary.finished;
    summary.errors.push(...leagueSummary.errors);
    summary.predictionsEvaluated += leagueSummary.predictionsEvaluated;
  }
  await refreshRankingSnapshot();
  summary.rankingRefreshed = true;

  return summary;
}

/** @deprecated syncAll 사용 */
export async function syncGameResults(): Promise<SyncResultSummary> {
  return syncAll();
}

/** 서버 전역 throttle (live-scores 등 Phase 3 전까지 유지) */
export async function syncGameResultsIfNeeded(
  intervalMs = SYNC_INTERVAL_MS,
): Promise<SyncResultSummary> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      ...emptySyncSummary(),
      skipped: true,
      errors: ["SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다."],
    };
  }

  const latestSyncedAt = await getLatestSyncedAt(supabase);
  if (
    latestSyncedAt &&
    Date.now() - new Date(latestSyncedAt).getTime() < intervalMs
  ) {
    return { ...emptySyncSummary(), skipped: true, errors: [] };
  }

  return syncAll();
}

export { SYNC_INTERVAL_MS, refreshRankingSnapshot, formatDateKst, getTodayKst };
