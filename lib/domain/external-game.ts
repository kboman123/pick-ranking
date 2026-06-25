import type { LeagueCode, SportCategory } from "./league";
import { getLeagueCategory } from "./league";

export type NormalizedStatus =
  | "Scheduled"
  | "Live"
  | "Finished"
  | "Postponed"
  | "Cancelled";

export type GameWinner = "home" | "away" | "draw";

export type ExternalTeam = {
  name: string;
  id?: string;
};

/** Provider-agnostic 외부 경기 DTO (Cache·Sync 공통) */
export type ExternalGame = {
  externalId: string;
  leagueCode: LeagueCode;
  category: SportCategory;
  homeTeam: ExternalTeam;
  awayTeam: ExternalTeam;
  scheduledAt: string;
  status: NormalizedStatus;
  homeScore: number | null;
  awayScore: number | null;
  liveDetail: string | null;
  winner: GameWinner | null;
};

export type FetchGamesQuery = {
  leagueCode: LeagueCode;
  dates: string[];
  season?: number;
};

export type LocalGameRef = {
  leagueCode: LeagueCode;
  homeTeam: string;
  awayTeam: string;
  scheduledAt: string;
  externalGameId?: number | null;
};

export function createExternalGame(
  partial: Omit<ExternalGame, "category"> & { category?: SportCategory },
): ExternalGame {
  return {
    ...partial,
    category: partial.category ?? getLeagueCategory(partial.leagueCode),
  };
}

export function isExternalGameFinished(game: ExternalGame): boolean {
  return game.status === "Finished";
}

export function isExternalGameLive(game: ExternalGame): boolean {
  return game.status === "Live";
}
