import type { FetchGamesQuery, LeagueCode, LocalGameRef } from "@/lib/domain";
import { BASEBALL_LEAGUES } from "@/lib/domain/league";
import { getApiSportsBaseballProvider } from "@/lib/providers/api-sports/baseball.adapter";
import type {
  LeagueProviderBinding,
  ProviderId,
  SportsDataProvider,
} from "@/lib/providers/types";

/** League → Provider 바인딩 (Phase 1: 전 리그 api-sports) */
export const LEAGUE_PROVIDER_BINDINGS: Record<LeagueCode, LeagueProviderBinding> = {
  KBO: { provider: "api-sports", externalLeagueId: 5 },
  NPB: { provider: "api-sports", externalLeagueId: 2 },
  MLB: { provider: "api-sports", externalLeagueId: 1 },
};

const providers: Record<ProviderId, SportsDataProvider> = {
  "api-sports": getApiSportsBaseballProvider(),
};

export class ProviderRegistry {
  getProvider(id: ProviderId): SportsDataProvider {
    const provider = providers[id];
    if (!provider) {
      throw new Error(`Unknown provider: ${id}`);
    }
    return provider;
  }

  getProviderForLeague(league: LeagueCode): SportsDataProvider {
    const binding = LEAGUE_PROVIDER_BINDINGS[league];
    if (!binding) {
      throw new Error(`No provider binding for league: ${league}`);
    }
    return this.getProvider(binding.provider);
  }

  getBinding(league: LeagueCode): LeagueProviderBinding {
    return LEAGUE_PROVIDER_BINDINGS[league];
  }

  getSupportedLeagues(): LeagueCode[] {
    return [...BASEBALL_LEAGUES];
  }

  isLeagueSupported(league: string): league is LeagueCode {
    return league in LEAGUE_PROVIDER_BINDINGS;
  }

  isAnyProviderConfigured(): boolean {
    return Object.values(providers).some((p) => p.isConfigured());
  }

  async fetchGamesForLeague(
    league: LeagueCode,
    dates: string[],
    season?: number,
  ) {
    const provider = this.getProviderForLeague(league);
    const query: FetchGamesQuery = { leagueCode: league, dates, season };
    return provider.fetchGames(query);
  }

  async resolveExternalGame(
    local: LocalGameRef,
    candidates: Awaited<ReturnType<SportsDataProvider["fetchGames"]>>,
  ) {
    const provider = this.getProviderForLeague(local.leagueCode);

    if (local.externalGameId != null) {
      const direct = await provider.fetchGameById(
        local.leagueCode,
        String(local.externalGameId),
      );
      if (direct) return direct;
    }

    return provider.matchLocalGame(local, candidates);
  }
}

let registryInstance: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!registryInstance) {
    registryInstance = new ProviderRegistry();
  }
  return registryInstance;
}
