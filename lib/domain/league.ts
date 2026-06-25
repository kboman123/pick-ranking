/** 앱·DB·Provider 공통 리그 코드 (Phase 1: 기존 Sport와 동일) */
export type LeagueCode = "KBO" | "MLB" | "NPB";

export type SportCategory = "baseball" | "football";

export const LEAGUE_CATEGORY: Record<LeagueCode, SportCategory> = {
  KBO: "baseball",
  MLB: "baseball",
  NPB: "baseball",
};

export const BASEBALL_LEAGUES: LeagueCode[] = ["KBO", "MLB", "NPB"];

export function getLeagueCategory(league: LeagueCode): SportCategory {
  return LEAGUE_CATEGORY[league];
}

export function isLeagueCode(value: string): value is LeagueCode {
  return value === "KBO" || value === "MLB" || value === "NPB";
}
