import {
  createExternalGame,
  type ExternalGame,
  type FetchGamesQuery,
  type LeagueCode,
  type LocalGameRef,
} from "@/lib/domain";
import { BASEBALL_LEAGUES } from "@/lib/domain/league";
import type { LeagueProviderBinding, SportsDataProvider } from "@/lib/providers/types";
import {
  extractLiveDetail,
  normalizeRawStatus,
  resolveWinnerFromScores,
} from "@/lib/providers/shared/normalize-status";
import { matchLocalGameToExternal } from "@/lib/providers/shared/team-matcher";
import {
  currentSeasonYear,
  fetchApiSports,
  isApiSportsConfigured,
} from "./client";

/** API-SPORTS Baseball league IDs (Dashboard 기준) */
export const API_SPORTS_BASEBALL_LEAGUE_IDS: Record<LeagueCode, number> = {
  MLB: 1,
  NPB: 2,
  KBO: 5,
};

type ApiBaseballGame = {
  id: number;
  date: string;
  status: { long: string; short: string };
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

function mapToExternalGame(
  raw: ApiBaseballGame,
  leagueCode: LeagueCode,
): ExternalGame {
  const homeScore = raw.scores.home.total;
  const awayScore = raw.scores.away.total;
  const status = normalizeRawStatus(raw.status);

  return createExternalGame({
    externalId: String(raw.id),
    leagueCode,
    homeTeam: { id: String(raw.teams.home.id), name: raw.teams.home.name },
    awayTeam: { id: String(raw.teams.away.id), name: raw.teams.away.name },
    scheduledAt: raw.date,
    status,
    homeScore,
    awayScore,
    liveDetail: extractLiveDetail(raw.status, leagueCode),
    winner: resolveWinnerFromScores(homeScore, awayScore),
  });
}

export class ApiSportsBaseballProvider implements SportsDataProvider {
  readonly id = "api-sports" as const;
  readonly supportedLeagues = BASEBALL_LEAGUES;

  isConfigured(): boolean {
    return isApiSportsConfigured();
  }

  async fetchGames(query: FetchGamesQuery): Promise<ExternalGame[]> {
    const leagueId = API_SPORTS_BASEBALL_LEAGUE_IDS[query.leagueCode];
    const season = query.season ?? currentSeasonYear();
    const byId = new Map<string, ExternalGame>();

    for (const date of query.dates) {
      const rawGames = await fetchApiSports<ApiBaseballGame[]>("games", {
        league: leagueId,
        season,
        date,
        timezone: "Asia/Seoul",
      });

      for (const raw of rawGames) {
        byId.set(String(raw.id), mapToExternalGame(raw, query.leagueCode));
      }
    }

    return [...byId.values()];
  }

  async fetchGameById(
    leagueCode: LeagueCode,
    externalId: string,
  ): Promise<ExternalGame | null> {
    const rawGames = await fetchApiSports<ApiBaseballGame[]>("games", {
      id: Number(externalId),
    });
    const raw = rawGames[0];
    if (!raw) return null;
    return mapToExternalGame(raw, leagueCode);
  }

  matchLocalGame(
    local: LocalGameRef,
    candidates: ExternalGame[],
  ): ExternalGame | null {
    return matchLocalGameToExternal(local, candidates);
  }
}

export function getLeagueBinding(league: LeagueCode): LeagueProviderBinding {
  return {
    provider: "api-sports",
    externalLeagueId: API_SPORTS_BASEBALL_LEAGUE_IDS[league],
  };
}

/** Registry 외부에서 단일 Provider 인스턴스가 필요할 때 */
let providerInstance: ApiSportsBaseballProvider | null = null;

export function getApiSportsBaseballProvider(): ApiSportsBaseballProvider {
  if (!providerInstance) {
    providerInstance = new ApiSportsBaseballProvider();
  }
  return providerInstance;
}
