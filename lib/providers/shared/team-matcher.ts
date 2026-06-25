import type { ExternalGame, LocalGameRef } from "@/lib/domain";
import type { LeagueCode } from "@/lib/domain/league";

/** 한글/영문 팀명 별칭 (앱 등록명 ↔ 외부 Feed) */
const TEAM_ALIASES: Partial<Record<LeagueCode, Record<string, string[]>>> = {
  KBO: {
    "두산": ["doosan", "bears"],
    "LG": ["lg", "twins"],
    "KT": ["kt", "wiz"],
    "SSG": ["ssg", "landers", "sk"],
    "NC": ["nc", "dinos"],
    "KIA": ["kia", "tigers"],
    "삼성": ["samsung", "lions"],
    "롯데": ["lotte", "giants"],
    "한화": ["hanwha", "eagles"],
    "키움": ["kiwoom", "heroes"],
  },
  NPB: {
    "요미우리": ["yomiuri", "giants"],
    "한신": ["hanshin", "tigers"],
    "소프트뱅크": ["softbank", "hawks", "fukuoka"],
    "라쿠텐": ["rakuten", "eagles"],
    "세이부": ["seibu", "lions", "saitama"],
    "오릭스": ["orix", "buffaloes"],
    "롯데": ["lotte", "marines", "chiba"],
    "닛폰": ["nippon", "ham", "fighters", "hokkaido"],
    "야쿠르트": ["yakult", "swallows", "tokyo"],
    "DeNA": ["dena", "baystars", "yokohama"],
    "주니치": ["chunichi", "dragons"],
    "히로시마": ["hiroshima", "carp", "toyo"],
  },
  MLB: {},
};

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9가-힣]/g, "");
}

function tokenSet(name: string): Set<string> {
  const normalized = normalizeToken(name);
  const parts = name
    .split(/[\s·\-/]+/)
    .map(normalizeToken)
    .filter((p) => p.length >= 2);
  parts.push(normalized);
  return new Set(parts);
}

function expandAliases(league: LeagueCode, name: string): Set<string> {
  const tokens = tokenSet(name);
  const aliases = TEAM_ALIASES[league] ?? {};

  for (const [key, values] of Object.entries(aliases)) {
    const keyNorm = normalizeToken(key);
    const matched =
      tokens.has(keyNorm) ||
      [...tokens].some((t) => t.includes(keyNorm) || keyNorm.includes(t));

    if (matched) {
      values.forEach((v) => tokens.add(normalizeToken(v)));
    }
  }

  return tokens;
}

function teamSimilarity(
  league: LeagueCode,
  localName: string,
  apiName: string,
): number {
  const localTokens = expandAliases(league, localName);
  const apiTokens = expandAliases(league, apiName);

  let score = 0;
  for (const token of localTokens) {
    if (token.length < 2) continue;
    for (const apiToken of apiTokens) {
      if (token === apiToken) score += 3;
      else if (token.includes(apiToken) || apiToken.includes(token)) {
        score += 2;
      }
    }
  }

  const localNorm = normalizeToken(localName);
  const apiNorm = normalizeToken(apiName);
  if (localNorm && apiNorm) {
    if (localNorm === apiNorm) score += 5;
    else if (localNorm.includes(apiNorm) || apiNorm.includes(localNorm)) {
      score += 3;
    }
  }

  return score;
}

function scheduleDeltaMs(localIso: string, apiIso: string): number {
  return Math.abs(new Date(localIso).getTime() - new Date(apiIso).getTime());
}

/** DB 경기와 ExternalGame 매칭 (Provider-agnostic) */
export function matchLocalGameToExternal(
  local: LocalGameRef,
  candidates: ExternalGame[],
  maxScheduleDeltaMs = 3 * 60 * 60 * 1000,
): ExternalGame | null {
  let best: { game: ExternalGame; score: number } | null = null;

  for (const game of candidates) {
    const delta = scheduleDeltaMs(local.scheduledAt, game.scheduledAt);
    if (delta > maxScheduleDeltaMs) continue;

    const homeScore = teamSimilarity(
      local.leagueCode,
      local.homeTeam,
      game.homeTeam.name,
    );
    const awayScore = teamSimilarity(
      local.leagueCode,
      local.awayTeam,
      game.awayTeam.name,
    );
    const swappedHome = teamSimilarity(
      local.leagueCode,
      local.homeTeam,
      game.awayTeam.name,
    );
    const swappedAway = teamSimilarity(
      local.leagueCode,
      local.awayTeam,
      game.homeTeam.name,
    );

    const teamScore = Math.max(homeScore + awayScore, swappedHome + swappedAway);
    if (teamScore < 4) continue;

    const totalScore = teamScore - delta / (60 * 60 * 1000);
    if (!best || totalScore > best.score) {
      best = { game, score: totalScore };
    }
  }

  return best?.game ?? null;
}
