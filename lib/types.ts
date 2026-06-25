export type Sport = "KBO" | "MLB" | "NPB";

/** 홈/원정 승 — 예측·결과 공통 값 */
export type MatchOutcome = "home" | "away";

export type GameStatus =
  | "Scheduled"
  | "Live"
  | "Finished"
  | "Postponed"
  | "Cancelled"
  | string;

export type Match = {
  id: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  scheduledAt: string;
  createdAt: string;
  /** game_result */
  result?: MatchOutcome | null;
  resultAt?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: GameStatus;
  /** Live: 이닝(7회). Soccer 확장: 경기시간(45' 등) */
  statusDetail?: string | null;
  apiSportsGameId?: number | null;
  syncedAt?: string | null;
};

export type MatchInput = {
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  scheduledAt: string;
};

export const SPORTS: Sport[] = ["KBO", "MLB", "NPB"];
