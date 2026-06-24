import { computeRanking } from "./ranking-calculator";
import type { RankingPeriod } from "./ranking-period";
import type { RankedMember } from "./ranking";
import { getSupabase } from "./supabase/client";
import {
  USER_COLUMNS,
  USER_SELECT,
  USERS_TABLE,
} from "./supabase/users-schema";

export async function fetchRanking(
  period: RankingPeriod = "overall",
): Promise<RankedMember[]> {
  const supabase = getSupabase();

  const [usersResult, gamesResult, predictionsResult] = await Promise.all([
    supabase.from(USERS_TABLE).select(USER_SELECT),
    supabase.from("games").select("id, result, result_at, created_at"),
    supabase
      .from("predictions")
      .select("user_id, game_id, pick, created_at"),
  ]);

  if (usersResult.error || gamesResult.error || predictionsResult.error) {
    return [];
  }

  return computeRanking(
    (usersResult.data ?? []).map((user) => ({
      id: user[USER_COLUMNS.id],
      nickname: user[USER_COLUMNS.nickname],
    })),
    gamesResult.data ?? [],
    predictionsResult.data ?? [],
    period,
  );
}
