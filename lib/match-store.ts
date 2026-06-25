import { MATCHES_UPDATED_EVENT, RESULTS_UPDATED_EVENT, emitDataEvent } from "./events";
import { rowToMatch } from "./match-mapper";
import { getSupabase } from "./supabase/client";
import type { Match, MatchInput, MatchOutcome } from "./types";

export { rowToMatch } from "./match-mapper";

export async function fetchMatches(): Promise<Match[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("scheduled_at", { ascending: true });

  if (error || !data) return [];
  return data.map(rowToMatch);
}

export async function addMatch(input: MatchInput): Promise<Match> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("games")
    .insert({
      sport: input.sport,
      home_team: input.homeTeam.trim(),
      away_team: input.awayTeam.trim(),
      scheduled_at: input.scheduledAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "경기 등록에 실패했습니다.");
  }

  emitDataEvent(MATCHES_UPDATED_EVENT);
  return rowToMatch(data);
}

export async function updateMatch(
  id: string,
  input: MatchInput,
): Promise<Match | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("games")
    .update({
      sport: input.sport,
      home_team: input.homeTeam.trim(),
      away_team: input.awayTeam.trim(),
      scheduled_at: input.scheduledAt,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return null;

  emitDataEvent(MATCHES_UPDATED_EVENT);
  return rowToMatch(data);
}

export async function deleteMatch(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase.from("games").delete().eq("id", id);

  if (error) return false;

  emitDataEvent(MATCHES_UPDATED_EVENT);
  return true;
}

export async function getTodayMatchCount(): Promise<number> {
  const matches = await fetchMatches();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return matches.filter((match) => {
    const date = new Date(match.scheduledAt);
    return date >= today && date < tomorrow;
  }).length;
}

export function buildResultMap(matches: Match[]): Record<string, MatchOutcome> {
  return Object.fromEntries(
    matches
      .filter((m) => m.result)
      .map((m) => [m.id, m.result!]),
  );
}

/** 관리자 결과 저장 → games.result 업데이트 */
export async function saveGameResults(
  results: Record<string, MatchOutcome>,
): Promise<void> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const updates = Object.entries(results).map(([gameId, result]) =>
    supabase
      .from("games")
      .update({ result, result_at: now })
      .eq("id", gameId),
  );

  const settled = await Promise.all(updates);
  const failed = settled.find((r) => r.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  emitDataEvent(RESULTS_UPDATED_EVENT);
  emitDataEvent(MATCHES_UPDATED_EVENT);
}
