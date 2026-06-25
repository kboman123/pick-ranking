import type { PickOutcome } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;

/** 경기 종료 시 predictions.is_hit 자동 계산 */
export async function evaluatePredictionsForGames(
  supabase: AdminClient,
  gameIds: string[],
): Promise<number> {
  if (gameIds.length === 0) return 0;

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("id, result")
    .in("id", gameIds)
    .not("result", "is", null);

  if (gamesError || !games?.length) return 0;

  const resultMap = new Map(
    games.map((g) => [g.id, g.result as PickOutcome]),
  );

  const { data: predictions, error: predError } = await supabase
    .from("predictions")
    .select("id, game_id, pick")
    .in("game_id", gameIds);

  if (predError || !predictions?.length) return 0;

  const now = new Date().toISOString();
  let evaluated = 0;

  for (const prediction of predictions) {
    const gameResult = resultMap.get(prediction.game_id);
    if (!gameResult) continue;

    const isHit = prediction.pick === gameResult;
    const { error } = await supabase
      .from("predictions")
      .update({ is_hit: isHit, evaluated_at: now })
      .eq("id", prediction.id);

    if (!error) evaluated += 1;
  }

  return evaluated;
}
