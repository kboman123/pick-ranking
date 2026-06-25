export type { ProviderId, SportsDataProvider, LeagueProviderBinding } from "./types";
export {
  getProviderRegistry,
  ProviderRegistry,
  LEAGUE_PROVIDER_BINDINGS,
} from "./registry";

export { getApiSportsBaseballProvider } from "./api-sports/baseball.adapter";
export { isApiSportsConfigured, getApiSportsKey } from "./api-sports/client";

export { matchLocalGameToExternal } from "./shared/team-matcher";
export {
  normalizeRawStatus,
  extractLiveDetail,
  resolveWinnerFromScores,
  externalGameToPickOutcome,
  isRawGameFinished,
  isRawGameLive,
} from "./shared/normalize-status";
