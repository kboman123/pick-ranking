import type { DbGame } from "./supabase/database.types";
import type { Match } from "./types";

export function rowToMatch(row: DbGame): Match {
  return {
    id: row.id,
    sport: row.sport,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    result: row.result,
    resultAt: row.result_at,
    homeScore: row.home_score ?? null,
    awayScore: row.away_score ?? null,
    status: row.status ?? "Scheduled",
    statusDetail: row.status_detail ?? null,
    apiSportsGameId: row.api_sports_game_id ?? null,
    syncedAt: row.synced_at ?? null,
  };
}
