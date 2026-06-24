import { getSupabase } from "./supabase/client";

export type MatchOpinion = {
  matchId: string;
  homeCount: number;
  awayCount: number;
  total: number;
  homePercent: number;
  awayPercent: number;
};

function emptyOpinion(matchId: string): MatchOpinion {
  return {
    matchId,
    homeCount: 0,
    awayCount: 0,
    total: 0,
    homePercent: 0,
    awayPercent: 0,
  };
}

export async function fetchGameOpinions(
  matchIds: string[],
): Promise<Record<string, MatchOpinion>> {
  if (matchIds.length === 0) return {};

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("game_opinion_view")
    .select("*")
    .in("game_id", matchIds);

  if (error || !data) {
    return Object.fromEntries(matchIds.map((id) => [id, emptyOpinion(id)]));
  }

  const map = Object.fromEntries(
    data.map((row) => [
      row.game_id,
      {
        matchId: row.game_id,
        homeCount: row.home_count,
        awayCount: row.away_count,
        total: row.total_predictions,
        homePercent: row.home_percent,
        awayPercent: row.away_percent,
      },
    ]),
  );

  for (const id of matchIds) {
    if (!map[id]) map[id] = emptyOpinion(id);
  }

  return map;
}
