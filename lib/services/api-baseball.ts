/**
 * @deprecated Phase 1 이후 `lib/providers`를 사용하세요.
 * 하위 호환용 re-export.
 */
import type { Sport } from "@/lib/types";
import {
  API_SPORTS_BASEBALL_LEAGUE_IDS,
  getApiSportsBaseballProvider,
} from "@/lib/providers/api-sports/baseball.adapter";
import {
  currentSeasonYear,
  isApiSportsConfigured,
  getApiSportsKey,
} from "@/lib/providers/api-sports/client";
import {
  extractLiveDetail,
  isRawGameFinished,
  isRawGameLive,
  normalizeRawStatus,
  resolveWinnerFromScores,
} from "@/lib/providers/shared/normalize-status";

export const BASEBALL_LEAGUE_IDS = API_SPORTS_BASEBALL_LEAGUE_IDS;

export type ApiGameStatus = { long: string; short: string };

export type ApiBaseballGame = {
  id: number;
  date: string;
  timestamp?: number;
  status: ApiGameStatus;
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  scores: {
    home: { total: number | null };
    away: { total: number | null };
  };
};

export { getApiSportsKey as getApiBaseballKey, isApiSportsConfigured as isApiBaseballConfigured };

export async function fetchLeagueGamesByDate(
  sport: Sport,
  date: string,
  season = currentSeasonYear(),
): Promise<ApiBaseballGame[]> {
  const provider = getApiSportsBaseballProvider();
  const games = await provider.fetchGames({
    leagueCode: sport,
    dates: [date],
    season,
  });

  return games.map((g) => ({
    id: Number(g.externalId),
    date: g.scheduledAt,
    status: { long: g.status, short: g.status },
    league: {
      id: API_SPORTS_BASEBALL_LEAGUE_IDS[sport],
      name: sport,
      season,
    },
    teams: {
      home: { id: Number(g.homeTeam.id ?? 0), name: g.homeTeam.name },
      away: { id: Number(g.awayTeam.id ?? 0), name: g.awayTeam.name },
    },
    scores: {
      home: { total: g.homeScore },
      away: { total: g.awayScore },
    },
  }));
}

export async function fetchGameById(
  apiGameId: number,
  sport: Sport = "KBO",
): Promise<ApiBaseballGame | null> {
  const provider = getApiSportsBaseballProvider();
  const game = await provider.fetchGameById(sport, String(apiGameId));
  if (!game) return null;

  return {
    id: Number(game.externalId),
    date: game.scheduledAt,
    status: { long: game.status, short: game.status },
    league: {
      id: API_SPORTS_BASEBALL_LEAGUE_IDS[sport],
      name: sport,
      season: currentSeasonYear(),
    },
    teams: {
      home: { id: Number(game.homeTeam.id ?? 0), name: game.homeTeam.name },
      away: { id: Number(game.awayTeam.id ?? 0), name: game.awayTeam.name },
    },
    scores: {
      home: { total: game.homeScore },
      away: { total: game.awayScore },
    },
  };
}

export function isGameFinished(game: ApiBaseballGame): boolean {
  return isRawGameFinished(game.status);
}

export function isGameLive(game: ApiBaseballGame): boolean {
  return isRawGameLive(game.status);
}

export function mapApiStatus(game: ApiBaseballGame): string {
  return normalizeRawStatus(game.status);
}

export function resolveGameResult(
  game: ApiBaseballGame,
): "home" | "away" | null {
  const winner = resolveWinnerFromScores(
    game.scores.home.total,
    game.scores.away.total,
  );
  if (winner === "home" || winner === "away") return winner;
  return null;
}

export function extractStatusDetail(
  game: ApiBaseballGame,
  sport: Sport,
): string | null {
  return extractLiveDetail(game.status, sport);
}
