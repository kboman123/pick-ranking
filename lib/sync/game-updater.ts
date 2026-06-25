import type { ExternalGame } from "@/lib/domain";
import { isExternalGameFinished } from "@/lib/domain/external-game";
import { externalGameToPickOutcome } from "@/lib/providers/shared/normalize-status";
import type { PickOutcome } from "@/lib/supabase/database.types";

export type GameWritePayload = {
  sport: ExternalGame["leagueCode"];
  home_team: string;
  away_team: string;
  scheduled_at: string;
  status: ExternalGame["status"];
  status_detail: string | null;
  home_score: number | null;
  away_score: number | null;
  api_sports_game_id: number | null;
  synced_at: string;
  result?: PickOutcome | null;
  result_at?: string | null;
};

function parseExternalId(externalId: string): number | null {
  const num = Number(externalId);
  return Number.isFinite(num) ? num : null;
}

/** ExternalGame → games INSERT/UPDATE 공통 필드 */
export function buildGameWritePayload(
  external: ExternalGame,
  syncedAt: string,
): GameWritePayload {
  const finished = isExternalGameFinished(external);
  const gameResult = finished ? externalGameToPickOutcome(external) : null;

  const payload: GameWritePayload = {
    sport: external.leagueCode,
    home_team: external.homeTeam.name.trim(),
    away_team: external.awayTeam.name.trim(),
    scheduled_at: external.scheduledAt,
    status: external.status,
    status_detail: external.liveDetail,
    home_score: external.homeScore,
    away_score: external.awayScore,
    api_sports_game_id: parseExternalId(external.externalId),
    synced_at: syncedAt,
    result: null,
    result_at: null,
  };

  if (finished && gameResult) {
    payload.result = gameResult;
    payload.result_at = syncedAt;
  }

  return payload;
}
