export type { LeagueCode, SportCategory } from "./league";
export {
  BASEBALL_LEAGUES,
  getLeagueCategory,
  isLeagueCode,
  LEAGUE_CATEGORY,
} from "./league";

export type {
  ExternalGame,
  ExternalTeam,
  FetchGamesQuery,
  GameWinner,
  LocalGameRef,
  NormalizedStatus,
} from "./external-game";
export {
  createExternalGame,
  isExternalGameFinished,
  isExternalGameLive,
} from "./external-game";
