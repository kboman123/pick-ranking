import type {
  ExternalGame,
  FetchGamesQuery,
  LeagueCode,
  LocalGameRef,
} from "@/lib/domain";

export type ProviderId = "api-sports";

/** 외부 Feed 어댑터 — Cache Layer는 Phase 2에서 이 인터페이스 앞에 삽입 */
export interface SportsDataProvider {
  readonly id: ProviderId;
  readonly supportedLeagues: LeagueCode[];

  isConfigured(): boolean;
  fetchGames(query: FetchGamesQuery): Promise<ExternalGame[]>;
  fetchGameById(
    leagueCode: LeagueCode,
    externalId: string,
  ): Promise<ExternalGame | null>;
  matchLocalGame(
    local: LocalGameRef,
    candidates: ExternalGame[],
  ): ExternalGame | null;
}

export type LeagueProviderBinding = {
  provider: ProviderId;
  externalLeagueId: number;
};
