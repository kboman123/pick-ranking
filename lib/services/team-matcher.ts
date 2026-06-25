/**
 * @deprecated `lib/providers/shared/team-matcher`의 matchLocalGameToExternal 사용
 */
import type { Sport } from "@/lib/types";
import type { ApiBaseballGame } from "./api-baseball";
import { matchLocalGameToExternal } from "@/lib/providers/shared/team-matcher";
import { createExternalGame } from "@/lib/domain";

export type MatchCandidate = {
  game: ApiBaseballGame;
  score: number;
  scheduleDeltaMs: number;
};

export function findBestApiGameMatch(
  sport: Sport,
  homeTeam: string,
  awayTeam: string,
  scheduledAt: string,
  candidates: ApiBaseballGame[],
  maxScheduleDeltaMs = 3 * 60 * 60 * 1000,
): ApiBaseballGame | null {
  const externalCandidates = candidates.map((g) =>
    createExternalGame({
      externalId: String(g.id),
      leagueCode: sport,
      homeTeam: { name: g.teams.home.name },
      awayTeam: { name: g.teams.away.name },
      scheduledAt: g.date,
      status: "Scheduled",
      homeScore: g.scores.home.total,
      awayScore: g.scores.away.total,
      liveDetail: null,
      winner: null,
    }),
  );

  const matched = matchLocalGameToExternal(
    { leagueCode: sport, homeTeam, awayTeam, scheduledAt },
    externalCandidates,
    maxScheduleDeltaMs,
  );

  if (!matched) return null;
  return candidates.find((c) => String(c.id) === matched.externalId) ?? null;
}

export { matchLocalGameToExternal } from "@/lib/providers/shared/team-matcher";
