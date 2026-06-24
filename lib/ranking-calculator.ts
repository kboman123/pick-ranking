import type { RankedMember } from "./ranking";
import {
  getRankingPeriodBounds,
  isInPeriod,
  type PeriodBounds,
  type RankingPeriod,
} from "./ranking-period";

type RankingUser = {
  id: string;
  nickname: string;
};

type RankingGame = {
  id: string;
  result: "home" | "away" | null;
  result_at: string | null;
  created_at: string;
};

type RankingPrediction = {
  user_id: string;
  game_id: string;
  pick: "home" | "away";
  created_at: string;
};

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function sortRanking(members: Omit<RankedMember, "rank">[]): RankedMember[] {
  return members
    .sort((a, b) => {
      if (b.rankingScore !== a.rankingScore) {
        return b.rankingScore - a.rankingScore;
      }
      if (b.hits !== a.hits) return b.hits - a.hits;
      if (b.participated !== a.participated) {
        return b.participated - a.participated;
      }
      return a.name.localeCompare(b.name, "ko");
    })
    .map((member, index) => ({ ...member, rank: index + 1 }));
}

function resultCountsInPeriod(
  resultAt: string | null,
  bounds: PeriodBounds | null,
): boolean {
  if (!bounds) return true;
  if (!resultAt) return false;
  return isInPeriod(resultAt, bounds);
}

export function computeRanking(
  users: RankingUser[],
  games: RankingGame[],
  predictions: RankingPrediction[],
  period: RankingPeriod,
  now = new Date(),
): RankedMember[] {
  const bounds = getRankingPeriodBounds(period, now);

  const periodGames = games.filter((game) =>
    isInPeriod(game.created_at, bounds),
  );
  const periodGameIds = new Set(periodGames.map((game) => game.id));
  const totalGames = periodGames.length;

  const gameMap = new Map(games.map((game) => [game.id, game]));

  const periodPredictions = predictions.filter((prediction) =>
    isInPeriod(prediction.created_at, bounds),
  );

  const predictionsByUser = new Map<string, RankingPrediction[]>();
  for (const prediction of periodPredictions) {
    if (!periodGameIds.has(prediction.game_id)) continue;
    const list = predictionsByUser.get(prediction.user_id) ?? [];
    list.push(prediction);
    predictionsByUser.set(prediction.user_id, list);
  }

  const members: Omit<RankedMember, "rank">[] = [];

  for (const user of users) {
    const userPredictions = predictionsByUser.get(user.id) ?? [];
    if (userPredictions.length === 0) continue;

    const participatedGameIds = new Set(
      userPredictions.map((prediction) => prediction.game_id),
    );
    const participated = participatedGameIds.size;

    let hits = 0;
    let misses = 0;

    for (const prediction of userPredictions) {
      const game = gameMap.get(prediction.game_id);
      if (!game?.result) continue;
      if (!resultCountsInPeriod(game.result_at, bounds)) continue;

      if (prediction.pick === game.result) hits += 1;
      else misses += 1;
    }

    const decided = hits + misses;
    const nonParticipation = Math.max(0, totalGames - participated);
    const rankingScore =
      totalGames === 0 ? 0 : roundScore((hits / totalGames) * 100);
    const hitRate = decided === 0 ? 0 : roundScore((hits / decided) * 100);

    members.push({
      id: user.id,
      name: user.nickname,
      totalGames,
      participated,
      hits,
      misses,
      nonParticipation,
      hitRate,
      rankingScore,
    });
  }

  return sortRanking(members);
}
