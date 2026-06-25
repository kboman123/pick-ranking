import { computeRanking } from "@/lib/ranking-calculator";
import type { RankedMember } from "@/lib/ranking";
import { getSupabaseAdmin } from "@/lib/supabase/server-admin";
import {
  USER_COLUMNS,
  USER_SELECT,
  USERS_TABLE,
} from "@/lib/supabase/users-schema";

/** ranking_view 기반 랭킹 재계산 (서버 검증용) */
export async function refreshRankingSnapshot(): Promise<RankedMember[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const [usersResult, gamesResult, predictionsResult, rankingViewResult] =
    await Promise.all([
      supabase.from(USERS_TABLE).select(USER_SELECT),
      supabase.from("games").select("id, result, result_at, created_at"),
      supabase.from("predictions").select("user_id, game_id, pick, created_at"),
      supabase.from("ranking_view").select("*"),
    ]);

  if (usersResult.error || gamesResult.error || predictionsResult.error) {
    return rankingViewResult.data?.map((row, index) => ({
      id: row.user_id,
      name: row.nickname,
      rank: index + 1,
      totalGames: row.total_games,
      participated: row.participated,
      hits: row.hits,
      misses: row.misses,
      nonParticipation: row.non_participation,
      hitRate:
        row.participated === 0
          ? 0
          : Math.round((row.hits / row.participated) * 1000) / 10,
      rankingScore: Number(row.ranking_score),
    })) ?? [];
  }

  return computeRanking(
    (usersResult.data ?? []).map((user) => ({
      id: user[USER_COLUMNS.id],
      nickname: user[USER_COLUMNS.nickname] ?? "",
    })),
    gamesResult.data ?? [],
    predictionsResult.data ?? [],
    "overall",
  );
}

async function getLatestSyncedAt(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
): Promise<string | null> {
  const { data } = await supabase
    .from("games")
    .select("synced_at")
    .not("synced_at", "is", null)
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.synced_at ?? null;
}

export { getLatestSyncedAt };
