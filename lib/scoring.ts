import { buildResultMap } from "./match-store";
import type { Match, MatchOutcome } from "./types";

export type MatchEvaluation = {
  matchId: string;
  pick: MatchOutcome;
  result: MatchOutcome;
  isCorrect: boolean;
};

export type EvaluationStatus = "hit" | "miss" | "pending" | "no_pick";

export type MatchEvaluationDetail = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  sport: Match["sport"];
  scheduledAt: string;
  pick: MatchOutcome | null;
  result: MatchOutcome | null;
  status: EvaluationStatus;
};

export type PredictionScoreSummary = {
  total: number;
  hits: number;
  misses: number;
  pending: number;
  noPick: number;
  hitRate: number;
  evaluations: MatchEvaluation[];
  details: MatchEvaluationDetail[];
};

export function outcomeLabel(
  match: Pick<Match, "homeTeam" | "awayTeam">,
  outcome: MatchOutcome,
): string {
  return outcome === "home" ? `${match.homeTeam} 승` : `${match.awayTeam} 승`;
}

export function isPickCorrect(
  pick: MatchOutcome,
  result: MatchOutcome,
): boolean {
  return pick === result;
}

export function getEvaluationStatus(
  pick: MatchOutcome | null,
  result: MatchOutcome | null,
): EvaluationStatus {
  if (!pick) return "no_pick";
  if (!result) return "pending";
  return isPickCorrect(pick, result) ? "hit" : "miss";
}

function buildDetails(
  matches: Match[],
  results: Record<string, MatchOutcome>,
  pickMap: Record<string, MatchOutcome>,
): MatchEvaluationDetail[] {
  return matches.map((match) => {
    const pick = pickMap[match.id] ?? null;
    const result = results[match.id] ?? null;

    return {
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      sport: match.sport,
      scheduledAt: match.scheduledAt,
      pick,
      result,
      status: getEvaluationStatus(pick, result),
    };
  });
}

/** 예측 + 결과를 matchId 기준으로 일괄 비교 */
export function summarizePredictions(
  matches: Match[] = [],
  pickMap: Record<string, MatchOutcome> = {},
  resultsOverride?: Record<string, MatchOutcome>,
): PredictionScoreSummary {
  const results = resultsOverride ?? buildResultMap(matches);

  const details = buildDetails(matches, results, pickMap);

  const evaluations: MatchEvaluation[] = [];
  let hits = 0;
  let misses = 0;
  let pending = 0;
  let noPick = 0;

  for (const detail of details) {
    if (detail.status === "no_pick") {
      noPick += 1;
      continue;
    }
    if (detail.status === "pending") {
      pending += 1;
      continue;
    }

    evaluations.push({
      matchId: detail.matchId,
      pick: detail.pick!,
      result: detail.result!,
      isCorrect: detail.status === "hit",
    });

    if (detail.status === "hit") hits += 1;
    else misses += 1;
  }

  const total = hits + misses;

  return {
    total,
    hits,
    misses,
    pending,
    noPick,
    hitRate: total === 0 ? 0 : Math.round((hits / total) * 1000) / 10,
    evaluations,
    details,
  };
}
