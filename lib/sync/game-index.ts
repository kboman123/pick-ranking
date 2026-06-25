import type { ExternalGame, LocalGameRef } from "@/lib/domain";
import type { LeagueCode } from "@/lib/domain/league";
import { matchLocalGameToExternal } from "@/lib/providers/shared/team-matcher";
import type { DbGame } from "@/lib/supabase/database.types";

export type IndexedGame = Pick<
  DbGame,
  | "id"
  | "sport"
  | "home_team"
  | "away_team"
  | "scheduled_at"
  | "result"
  | "status"
  | "api_sports_game_id"
>;

export type GameIndex = {
  byExternalId: Map<number, IndexedGame>;
  byLeague: Map<LeagueCode, IndexedGame[]>;
  all: IndexedGame[];
};

export function buildGameIndex(games: IndexedGame[]): GameIndex {
  const byExternalId = new Map<number, IndexedGame>();
  const byLeague = new Map<LeagueCode, IndexedGame[]>();

  for (const game of games) {
    if (game.api_sports_game_id != null) {
      byExternalId.set(game.api_sports_game_id, game);
    }

    const list = byLeague.get(game.sport) ?? [];
    list.push(game);
    byLeague.set(game.sport, list);
  }

  return { byExternalId, byLeague, all: games };
}

function toLocalRef(game: IndexedGame): LocalGameRef {
  return {
    leagueCode: game.sport,
    homeTeam: game.home_team,
    awayTeam: game.away_team,
    scheduledAt: game.scheduled_at,
    externalGameId: game.api_sports_game_id,
  };
}

/** api_sports_game_id → 팀·시간 fuzzy 매칭 순으로 기존 경기 탐색 */
export function findExistingGame(
  external: ExternalGame,
  index: GameIndex,
): IndexedGame | null {
  const externalIdNum = Number(external.externalId);
  if (Number.isFinite(externalIdNum)) {
    const byId = index.byExternalId.get(externalIdNum);
    if (byId) return byId;
  }

  const leagueGames = index.byLeague.get(external.leagueCode) ?? [];

  for (const dbGame of leagueGames) {
    const matched = matchLocalGameToExternal(toLocalRef(dbGame), [external]);
    if (matched) return dbGame;
  }

  return null;
}
