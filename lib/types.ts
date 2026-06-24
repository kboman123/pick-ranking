export type Sport = "KBO" | "MLB" | "NPB";

/** 홈/원정 승 — 예측·결과 공통 값 */
export type MatchOutcome = "home" | "away";

export type Match = {
  id: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  scheduledAt: string;
  createdAt: string;
  result?: MatchOutcome | null;
  resultAt?: string | null;
};

export type MatchInput = {
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  scheduledAt: string;
};

export const SPORTS: Sport[] = ["KBO", "MLB", "NPB"];
